import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getAvailableSlotsSchema } from '~/features/mentorship/schemas/mentorship.schema';
import { getAvailableSlots } from '~/server/services/calcom/calcomService';
import {
	bucketScheduledBookingsByWeek,
	buildWeekWindows
} from '~/server/services/mentorship/weeklyBookingCounts';
import {
	adminProcedure,
	mentorshipProcedure,
	protectedProcedure
} from '../../trpc';

export const mentorshipQueries = {
	getMyMentorshipWeekInfo: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.userId;

		const info = await ctx.db.user.findUnique({
			where: { id: userId },
			select: {
				remainingWeeklySessions: true,
				weeklyMentorshipSessions: true,
				weeklySessionsResetAt: true
			}
		});

		const now = new Date();
		const nextMonday = new Date(now);
		const currentDay = now.getUTCDay();
		const daysUntilMonday = currentDay === 0 ? 7 : 8 - currentDay;
		nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
		nextMonday.setUTCHours(0, 0, 0, 0);

		const hasAvailableSessions = (info?.remainingWeeklySessions ?? 0) > 0;

		// One range query + in-memory bucketing instead of 4 serial counts.
		const weeks = buildWeekWindows(now, 4);
		const rangeStart = weeks[0]?.weekStart;
		const rangeEnd = weeks[weeks.length - 1]?.weekEnd;
		const bookings =
			rangeStart && rangeEnd
				? await ctx.db.mentorshipBooking.findMany({
						where: {
							userId,
							status: 'SCHEDULED',
							scheduledAt: { gte: rangeStart, lt: rangeEnd }
						},
						select: { scheduledAt: true }
					})
				: [];
		const weeklyBookingCounts = bucketScheduledBookingsByWeek(bookings, weeks);

		return {
			remainingWeeklySessions: info?.remainingWeeklySessions ?? 0,
			weeklyMentorshipSessions: info?.weeklyMentorshipSessions ?? 0,
			weeklySessionsResetAt: nextMonday,
			hasAvailableSessions,
			weeklyBookingCounts
		};
	}),

	getAvailableSlots: mentorshipProcedure
		.input(getAvailableSlotsSchema)
		.query(async ({ input }) => {
			const startDate = new Date(input.startDate);
			const endDate = new Date(input.endDate);

			return getAvailableSlots(startDate, endDate);
		}),

	getMyBookings: mentorshipProcedure.query(async ({ ctx }) => {
		const bookings = await ctx.db.mentorshipBooking.findMany({
			where: { userId: ctx.session.userId },
			orderBy: { scheduledAt: 'desc' }
		});

		return bookings;
	}),

	adminGetBooking: adminProcedure
		.input(z.object({ bookingId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const booking = await ctx.db.mentorshipBooking.findUnique({
				where: { id: input.bookingId },
				select: {
					id: true,
					scheduledAt: true,
					status: true,
					bookingUrl: true,
					meetingUrl: true,
					objective: true,
					followUp: true,
					user: { select: { id: true, name: true, email: true } }
				}
			});

			if (!booking) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Mentorship booking not found'
				});
			}

			return booking;
		})
};
