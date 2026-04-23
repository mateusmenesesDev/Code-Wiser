import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env';
import { cancelBookingSchema } from '~/features/mentorship/schemas/mentorship.schema';
import {
	cancelBooking as cancelCalcomBooking,
	createBooking,
	rescheduleBooking as rescheduleCalcomBooking
} from '~/server/services/calcom/calcomService';
import {
	canBookForWeek,
	isDateInCurrentWeek,
	getWeekBoundaries
} from '~/server/services/mentorship/mentorshipService';
import { mentorshipProcedure } from '../../trpc';

export const mentorshipMutations = {
	bookSession: mentorshipProcedure
		.input(
			z.object({
				start: z.string().datetime(),
				end: z.string().datetime(),
				timeZone: z.string().default('UTC'),
				attendeeName: z.string(),
				attendeeEmail: z.string().email()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			const scheduledDate = new Date(input.start);

			const bookingCheck = await canBookForWeek(userId, scheduledDate);
			if (!bookingCheck.canBook) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: bookingCheck.reason ?? 'Cannot book session for this week'
				});
			}

			try {
				// Create booking in Cal.com first to get the real calBookingId
				const calBooking = await createBooking({
					eventTypeId: env.CALCOM_EVENT_TYPE_ID,
					start: input.start,
					end: input.end,
					attendee: {
						name: input.attendeeName,
						email: input.attendeeEmail,
						timeZone: input.timeZone
					}
				});

				const meetingUrl =
					(calBooking as { meetingUrl?: string }).meetingUrl ?? null;
				const bookingUrl = `https://cal.com/booking/${calBooking.uid}`;

				// Upsert so a concurrent webhook fire doesn't create a duplicate
				const booking = await ctx.db.mentorshipBooking.upsert({
					where: { calBookingId: calBooking.uid },
					create: {
						userId,
						calEventId: env.CALCOM_EVENT_TYPE_ID,
						calBookingId: calBooking.uid,
						scheduledAt: scheduledDate,
						status: 'SCHEDULED',
						bookingUrl,
						meetingUrl
					},
					update: {
						scheduledAt: scheduledDate,
						status: 'SCHEDULED',
						bookingUrl,
						meetingUrl
					}
				});

				const isCurrentWeek = isDateInCurrentWeek(scheduledDate);
				if (isCurrentWeek) {
					await ctx.db.user.update({
						where: { id: userId },
						data: { remainingWeeklySessions: { decrement: 1 } }
					});
				}

				return booking;
			} catch (error) {
				console.error('Error creating booking:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						error instanceof Error ? error.message : 'Failed to create booking'
				});
			}
		}),

	cancelBooking: mentorshipProcedure
		.input(cancelBookingSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;

			// Get booking
			const booking = await ctx.db.mentorshipBooking.findUnique({
				where: { id: input.bookingId }
			});

			if (!booking) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Booking not found'
				});
			}

			// Check ownership
			if (booking.userId !== userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You can only cancel your own bookings'
				});
			}

			// Check if already cancelled
			if (
				booking.status === 'CANCELLED' ||
				booking.status === 'MENTOR_CANCELLED'
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Booking is already cancelled'
				});
			}

			// Check if already completed
			if (booking.status === 'COMPLETED') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot cancel a completed session'
				});
			}

			try {
				// Cancel in Cal.com
				// Note: Using API key authenticates as host, so reason is required
				await cancelCalcomBooking(
					booking.calBookingId,
					'Booking cancelled by attendee'
				);

				// Update booking status
				// Use updateMany with a where clause to ensure we only update if still SCHEDULED
				// This prevents double restoration if webhook arrives first
				const updateResult = await ctx.db.mentorshipBooking.updateMany({
					where: {
						id: input.bookingId,
						status: 'SCHEDULED' // Only update if still scheduled
					},
					data: { status: 'CANCELLED' }
				});

				// Only restore weekly sessions if we actually updated the booking
				// (i.e., it was still SCHEDULED and not already cancelled by webhook)
				if (updateResult.count > 0) {
					// Only restore weekly sessions if the booking was for the current week
					const isCurrentWeek = isDateInCurrentWeek(booking.scheduledAt);
					if (isCurrentWeek) {
						// Get current user data to ensure we don't exceed the weekly limit
						const user = await ctx.db.user.findUnique({
							where: { id: userId },
							select: {
								remainingWeeklySessions: true,
								weeklyMentorshipSessions: true
							}
						});

						if (user) {
							// Don't exceed the weekly limit
							const newCount = Math.min(
								user.remainingWeeklySessions + 1,
								user.weeklyMentorshipSessions
							);

							await ctx.db.user.update({
								where: { id: userId },
								data: {
									remainingWeeklySessions: newCount
								}
							});

							console.log(
								`Booking cancelled via mutation and session restored: ${input.bookingId}. Sessions: ${user.remainingWeeklySessions} -> ${newCount}`
							);
						}
					}
				} else {
					console.log(
						`Booking ${input.bookingId} was already cancelled (likely by webhook), skipping mutation restoration to prevent double restore`
					);
				}

				return { success: true };
			} catch (error) {
				console.error('Error cancelling booking:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						error instanceof Error ? error.message : 'Failed to cancel booking'
				});
			}
		}),

	rescheduleBooking: mentorshipProcedure
		.input(
			z.object({
				bookingId: z.string().uuid(),
				newStart: z.string().datetime(),
				newEnd: z.string().datetime()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;

			const booking = await ctx.db.mentorshipBooking.findUnique({
				where: { id: input.bookingId }
			});

			if (!booking) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
			}

			if (booking.userId !== userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You can only reschedule your own bookings'
				});
			}

			if (booking.status !== 'SCHEDULED') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only scheduled bookings can be rescheduled'
				});
			}

			const newDate = new Date(input.newStart);
			const oldDate = booking.scheduledAt;

			const newBookingCheck = await canBookForWeek(userId, newDate);
			const oldWeek = getWeekBoundaries(oldDate);
			const newWeek = getWeekBoundaries(newDate);
			const isDifferentWeek =
				oldWeek.weekStart.getTime() !== newWeek.weekStart.getTime();

			// Only validate cap if moving to a different week (old slot frees up its slot)
			if (isDifferentWeek && !newBookingCheck.canBook) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						newBookingCheck.reason ?? 'Cannot reschedule to this week (limit reached)'
				});
			}

			try {
				await rescheduleCalcomBooking(
					booking.calBookingId,
					input.newStart,
					'Rescheduled by attendee'
				);

				// Upsert so a concurrent webhook fire doesn't re-update with stale data
				await ctx.db.mentorshipBooking.update({
					where: { id: booking.id },
					data: { scheduledAt: newDate }
				});

				// Adjust remainingWeeklySessions based on week-boundary crossing
				const wasCurrentWeek = isDateInCurrentWeek(oldDate);
				const isNewCurrentWeek = isDateInCurrentWeek(newDate);

				if (wasCurrentWeek && !isNewCurrentWeek) {
					// Moved out of current week — restore counter
					const user = await ctx.db.user.findUnique({
						where: { id: userId },
						select: {
							remainingWeeklySessions: true,
							weeklyMentorshipSessions: true
						}
					});
					if (user) {
						await ctx.db.user.update({
							where: { id: userId },
							data: {
								remainingWeeklySessions: Math.min(
									user.remainingWeeklySessions + 1,
									user.weeklyMentorshipSessions
								)
							}
						});
					}
				} else if (!wasCurrentWeek && isNewCurrentWeek) {
					// Moved into current week — decrement counter
					await ctx.db.user.update({
						where: { id: userId },
						data: { remainingWeeklySessions: { decrement: 1 } }
					});
				}

				return { success: true };
			} catch (error) {
				console.error('Error rescheduling booking:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						error instanceof Error
							? error.message
							: 'Failed to reschedule booking'
				});
			}
		})
};
