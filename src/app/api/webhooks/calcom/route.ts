import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { env } from '~/env';
import crypto from 'node:crypto';
import type {
	CalcomWebhookPayload,
	CalcomBookingPayload
} from '~/server/services/calcom/types';

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

		// Check if user has remaining sessions
		if (user.remainingWeeklySessions <= 0) {
			console.error('User has no remaining sessions:', user.id);
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
				scheduledAt: new Date(startTime),
				status: 'SCHEDULED',
				bookingUrl,
				meetingUrl
			}
		});

		// Decrement user's remaining sessions
		await db.user.update({
			where: { id: user.id },
			data: {
				remainingWeeklySessions: {
					decrement: 1
				}
			}
		});

		console.log('Booking created successfully for user:', user.id);
	} catch (error) {
		console.error('Error handling booking created:', error);
		throw error;
	}
}

async function handleBookingRescheduled(eventData: CalcomBookingPayload) {
	try {
		const { uid, startTime } = eventData;

		// Update booking record
		await db.mentorshipBooking.updateMany({
			where: { calBookingId: uid },
			data: {
				scheduledAt: new Date(startTime)
			}
		});

		console.log('Booking rescheduled:', uid);
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

		// Update booking status
		await db.mentorshipBooking.update({
			where: { id: booking.id },
			data: { status: 'CANCELLED' }
		});

		// Restore user's session count
		await db.user.update({
			where: { id: booking.userId },
			data: {
				remainingWeeklySessions: {
					increment: 1
				}
			}
		});

		console.log('Booking cancelled and session restored:', uid);
	} catch (error) {
		console.error('Error handling booking cancelled:', error);
		throw error;
	}
}
