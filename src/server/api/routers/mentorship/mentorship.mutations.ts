import { mentorshipProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env';
import { cancelBookingSchema } from '~/features/mentorship/schemas/mentorship.schema';
import { cancelBooking as cancelCalcomBooking } from '~/server/services/calcom/calcomService';
import {
	isDateInCurrentWeek,
	canBookForWeek
} from '~/server/services/mentorship/mentorshipService';

export const mentorshipMutations = {
	bookSession: mentorshipProcedure
		.input(
			z.object({
				start: z.string().datetime(),
				end: z.string().datetime(),
				timeZone: z.string().default('UTC'),
				calBookingUid: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			const scheduledDate = new Date(input.start);

			// Check if user can book for the target week
			const bookingCheck = await canBookForWeek(userId, scheduledDate);

			if (!bookingCheck.canBook) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: bookingCheck.reason || 'Cannot book session for this week'
				});
			}

			try {
				// Save booking to database
				// Cal.com iframe already created the booking, we just track it
				const booking = await ctx.db.mentorshipBooking.create({
					data: {
						userId,
						calEventId: env.CALCOM_EVENT_TYPE_ID,
						calBookingId: input.calBookingUid || `booking-${Date.now()}`,
						scheduledAt: scheduledDate,
						status: 'SCHEDULED'
					}
				});

				// Only decrement remainingWeeklySessions if booking is for current week
				// This keeps the UI counter in sync for the current week
				const isCurrentWeek = isDateInCurrentWeek(scheduledDate);
				if (isCurrentWeek) {
					await ctx.db.user.update({
						where: { id: userId },
						data: {
							remainingWeeklySessions: {
								decrement: 1
							}
						}
					});
				}

				return booking;
			} catch (error) {
				console.error('Error saving booking:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						error instanceof Error ? error.message : 'Failed to save booking'
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
		})
};
