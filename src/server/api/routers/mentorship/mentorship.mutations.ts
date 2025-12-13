import { mentorshipProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env';
import { cancelBookingSchema } from '~/features/mentorship/schemas/mentorship.schema';
import { cancelBooking as cancelCalcomBooking } from '~/server/services/calcom/calcomService';

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

			// Check if user has available sessions
			const remainingWeeklySessions = await ctx.db.user.findUnique({
				where: { id: userId },
				select: { remainingWeeklySessions: true }
			});
			const hasSlots =
				(remainingWeeklySessions?.remainingWeeklySessions ?? 0) > 0;
			if (!hasSlots) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You have reached your weekly session limit'
				});
			}

			try {
				// Save booking to database
				// Cal.com Atoms already created the booking, we just track it
				const booking = await ctx.db.mentorshipBooking.create({
					data: {
						userId,
						calEventId: env.CALCOM_EVENT_TYPE_ID,
						calBookingId: input.calBookingUid || `booking-${Date.now()}`,
						scheduledAt: new Date(input.start),
						status: 'SCHEDULED'
					}
				});

				// Decrement weekly sessions
				await ctx.db.user.update({
					where: { id: userId },
					data: {
						remainingWeeklySessions: {
							decrement: 1
						}
					}
				});

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
				await cancelCalcomBooking(booking.calBookingId, 'Cancelled by user');

				// Update booking status
				await ctx.db.mentorshipBooking.update({
					where: { id: input.bookingId },
					data: { status: 'CANCELLED' }
				});

				// Restore weekly sessions
				await ctx.db.user.update({
					where: { id: userId },
					data: {
						remainingWeeklySessions: {
							increment: 1
						}
					}
				});

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
