import { getAvailableSlotsSchema } from '~/features/mentorship/schemas/mentorship.schema';
import { getAvailableSlots } from '~/server/services/calcom/calcomService';
import { getWeekBoundaries } from '~/server/services/mentorship/mentorshipService';
import { mentorshipProcedure, protectedProcedure } from '../../trpc';

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

		// Build per-week scheduled booking counts for the 4-week calendar window
		// so the client can compute lock states without additional round-trips.
		const weeklyBookingCounts: { weekStart: Date; scheduledCount: number }[] =
			[];

		for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
			const weekAnchor = new Date(now);
			weekAnchor.setUTCDate(now.getUTCDate() + weekOffset * 7);
			const { weekStart, weekEnd } = getWeekBoundaries(weekAnchor);

			const scheduledCount = await ctx.db.mentorshipBooking.count({
				where: {
					userId,
					scheduledAt: { gte: weekStart, lt: weekEnd },
					status: 'SCHEDULED'
				}
			});

			weeklyBookingCounts.push({ weekStart, scheduledCount });
		}

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
	})
};
