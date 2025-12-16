import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { env } from '~/env';
import crypto from 'node:crypto';
import type {
	CalcomWebhookPayload,
	CalcomBookingPayload
} from '~/server/services/calcom/types';
import {
	isDateInCurrentWeek,
	canBookForWeek
} from '~/server/services/mentorship/mentorshipService';

/**
 * Cal.com Webhook Handler
 *
 * This endpoint receives webhook events from Cal.com when bookings are created,
 * rescheduled, or cancelled.
 *
 * To set up in Cal.com:
 * 1. Go to Settings > Webhooks
 * 2. Add a new webhook with URL: https://yourdomain.com/api/webhooks/calcom
 * 3. Set the webhook secret (same as CALCOM_WEBHOOK_SECRET in .env)
 * 4. Subscribe to: booking.created, booking.rescheduled, booking.cancelled
 */
export async function POST(request: Request) {
	try {
		// Verify webhook signature
		const signature = request.headers.get('X-Cal-Signature-256');
		if (!signature) {
			console.error('Missing webhook signature');
			return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
		}

		// Get raw body for signature verification
		const rawBody = await request.text();
		const expectedSignature = crypto
			.createHmac('sha256', env.CALCOM_WEBHOOK_SECRET)
			.update(rawBody)
			.digest('hex');

		if (signature !== expectedSignature) {
			console.error('Invalid webhook signature');
			return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
		}

		// Parse payload after verification
		const webhookPayload = JSON.parse(rawBody) as CalcomWebhookPayload;

		console.log('Cal.com webhook received:', webhookPayload);

		const { triggerEvent, payload: eventData } = webhookPayload;

		// Handle PING event (test webhook)
		if (triggerEvent === 'PING') {
			console.log('Received PING event from Cal.com');
			return NextResponse.json({
				received: true,
				message: 'Webhook is configured correctly!'
			});
		}

		// Handle different webhook events
		switch (triggerEvent) {
			case 'BOOKING_CREATED':
				await handleBookingCreated(eventData);
				break;
			case 'BOOKING_RESCHEDULED':
				await handleBookingRescheduled(eventData);
				break;
			case 'BOOKING_CANCELLED':
				await handleBookingCancelled(eventData);
				break;
			default:
				console.log('Unhandled webhook event:', triggerEvent);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Error processing Cal.com webhook:', error);
		return NextResponse.json(
			{ error: 'Webhook processing failed' },
			{ status: 500 }
		);
	}
}

async function handleBookingCreated(eventData: CalcomBookingPayload) {
	try {
		const { uid, startTime, attendees, videoCallData, metadata } = eventData;

		// Extract user email from attendees
		const userEmail = attendees?.[0]?.email;
		if (!userEmail) {
			console.error('No attendee email found in booking');
			return;
		}

		// Find user by email
		const user = await db.user.findUnique({
			where: { email: userEmail }
		});

		if (!user) {
			console.error('User not found for email:', userEmail);
			return;
		}

		// Check if user has active mentorship
		if (user.mentorshipStatus !== 'ACTIVE') {
			console.error('User does not have active mentorship:', user.id);
			return;
		}

		const scheduledDate = new Date(startTime);

		// Check if user can book for the target week
		const bookingCheck = await canBookForWeek(user.id, scheduledDate);
		if (!bookingCheck.canBook) {
			console.error(
				`User ${user.id} cannot book for this week: ${bookingCheck.reason}`
			);
			return;
		}

		// Construct booking URL
		// Cal.com booking URLs are typically: https://cal.com/booking/{uid}
		const bookingUrl = `https://cal.com/booking/${uid}`;

		// Extract meeting URL from multiple possible locations
		const meetingUrl =
			(metadata as { videoCallUrl?: string })?.videoCallUrl || // Google Meet, Zoom, etc.
			videoCallData?.url || // Alternative location
			null;

		console.log('Extracted meeting URL:', meetingUrl);

		// Create booking record
		await db.mentorshipBooking.create({
			data: {
				userId: user.id,
				calEventId: env.CALCOM_EVENT_TYPE_ID,
				calBookingId: uid,
				scheduledAt: scheduledDate,
				status: 'SCHEDULED',
				bookingUrl,
				meetingUrl
			}
		});

		// Only decrement remainingWeeklySessions if booking is for current week
		// This keeps the UI counter in sync for the current week
		const isCurrentWeek = isDateInCurrentWeek(scheduledDate);
		if (isCurrentWeek) {
			await db.user.update({
				where: { id: user.id },
				data: {
					remainingWeeklySessions: {
						decrement: 1
					}
				}
			});
			console.log('Decremented weekly sessions for current week booking');
		} else {
			console.log(
				'Booking is for future week, not decrementing current week counter'
			);
		}

		console.log('Booking created successfully for user:', user.id);
	} catch (error) {
		console.error('Error handling booking created:', error);
		throw error;
	}
}

async function handleBookingRescheduled(eventData: CalcomBookingPayload) {
	try {
		const { uid, startTime } = eventData;

		// Find the existing booking
		const existingBooking = await db.mentorshipBooking.findFirst({
			where: { calBookingId: uid }
		});

		if (!existingBooking) {
			console.error('Booking not found for rescheduling:', uid);
			return;
		}

		const oldDate = existingBooking.scheduledAt;
		const newDate = new Date(startTime);

		// Check if the new week has available slots
		// We need to temporarily exclude the current booking from the count
		const bookingCheck = await canBookForWeek(existingBooking.userId, newDate);

		// If moving to a different week, we need to account for the fact that
		// the old booking will be freed up
		const oldWeekBoundaries = await import(
			'~/server/services/mentorship/mentorshipService'
		).then((m) => m.getWeekBoundaries(oldDate));
		const newWeekBoundaries = await import(
			'~/server/services/mentorship/mentorshipService'
		).then((m) => m.getWeekBoundaries(newDate));

		const isDifferentWeek =
			oldWeekBoundaries.weekStart.getTime() !==
			newWeekBoundaries.weekStart.getTime();

		// If moving to a different week and that week is full, block it
		if (isDifferentWeek && !bookingCheck.canBook) {
			console.error(
				`Cannot reschedule to new week: ${bookingCheck.reason}`,
				uid
			);
			return;
		}

		// If staying in the same week, the booking count won't change
		// If moving to a different week, we already validated above

		const wasInCurrentWeek = isDateInCurrentWeek(oldDate);
		const isInCurrentWeek = isDateInCurrentWeek(newDate);

		// Update booking record
		await db.mentorshipBooking.update({
			where: { id: existingBooking.id },
			data: {
				scheduledAt: newDate
			}
		});

		// Handle session count changes based on week transitions
		// Note: remainingWeeklySessions only tracks the CURRENT week
		if (wasInCurrentWeek && !isInCurrentWeek) {
			// Moved from current week to future week - restore current week counter
			await db.user.update({
				where: { id: existingBooking.userId },
				data: {
					remainingWeeklySessions: {
						increment: 1
					}
				}
			});
			console.log(
				'Booking rescheduled from current to future week, current week counter restored'
			);
		} else if (!wasInCurrentWeek && isInCurrentWeek) {
			// Moved from future week to current week - deduct from current week counter
			const user = await db.user.findUnique({
				where: { id: existingBooking.userId },
				select: { remainingWeeklySessions: true }
			});

			if (user && user.remainingWeeklySessions > 0) {
				await db.user.update({
					where: { id: existingBooking.userId },
					data: {
						remainingWeeklySessions: {
							decrement: 1
						}
					}
				});
				console.log(
					'Booking rescheduled from future to current week, current week counter deducted'
				);
			} else {
				console.error(
					'User has no remaining sessions in current week for rescheduled booking'
				);
			}
		} else {
			console.log(
				'Booking rescheduled within same week period, no current week counter change'
			);
		}

		console.log('Booking rescheduled successfully:', uid);
	} catch (error) {
		console.error('Error handling booking rescheduled:', error);
		throw error;
	}
}

async function handleBookingCancelled(eventData: CalcomBookingPayload) {
	try {
		const { uid } = eventData;

		// Find the booking
		const booking = await db.mentorshipBooking.findFirst({
			where: { calBookingId: uid }
		});

		if (!booking) {
			console.error('Booking not found:', uid);
			return;
		}

		// Check if booking is already cancelled
		// If it is, the mutation already handled the cancellation and session restoration
		// We should only update status if it's not already cancelled
		const wasAlreadyCancelled =
			booking.status === 'CANCELLED' || booking.status === 'MENTOR_CANCELLED';

		if (!wasAlreadyCancelled) {
			// Update booking status
			await db.mentorshipBooking.update({
				where: { id: booking.id },
				data: { status: 'CANCELLED' }
			});

			// Only restore session count if the booking was for the current week
			// Note: If booking was already cancelled, the mutation already restored sessions
			const isCurrentWeek = isDateInCurrentWeek(booking.scheduledAt);
			if (isCurrentWeek) {
				// Get current user data to ensure we don't exceed the weekly limit
				const user = await db.user.findUnique({
					where: { id: booking.userId },
					select: {
						remainingWeeklySessions: true,
						weeklyMentorshipSessions: true
					}
				});

				if (user) {
					// Don't exceed the weekly limit - only increment by 1
					const newCount = Math.min(
						user.remainingWeeklySessions + 1,
						user.weeklyMentorshipSessions
					);

					await db.user.update({
						where: { id: booking.userId },
						data: {
							remainingWeeklySessions: newCount
						}
					});

					console.log(
						`Booking cancelled via webhook and session restored for current week: ${uid}. Sessions: ${user.remainingWeeklySessions} -> ${newCount}`
					);
				}
			} else {
				console.log(
					'Booking cancelled via webhook but was for future week, no session restored:',
					uid
				);
			}
		} else {
			console.log(
				`Booking ${uid} was already cancelled (likely by mutation), skipping webhook restoration to prevent double restore`
			);
		}
	} catch (error) {
		console.error('Error handling booking cancelled:', error);
		throw error;
	}
}
