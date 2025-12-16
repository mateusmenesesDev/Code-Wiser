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
				await ctx.db.mentorshipBooking.update({
					where: { id: input.bookingId },
					data: { status: 'CANCELLED' }
				});

				// Only restore weekly sessions if the booking was for the current week
				const isCurrentWeek = isDateInCurrentWeek(booking.scheduledAt);
				if (isCurrentWeek) {
					await ctx.db.user.update({
						where: { id: userId },
						data: {
							remainingWeeklySessions: {
								increment: 1
							}
						}
					});
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
