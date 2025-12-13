import { mentorshipProcedure, protectedProcedure } from '../../trpc';
import { getAvailableSlotsSchema } from '~/features/mentorship/schemas/mentorship.schema';
import { getAvailableSlots } from '~/server/services/calcom/calcomService';
import { TRPCError } from '@trpc/server';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mentorshipQueries = {
	getMyMentorshipWeekInfo: protectedProcedure.query(async ({ ctx }) => {
		await wait(4000);
		const info = await ctx.db.user.findUnique({
			where: { id: ctx.session.userId },
			select: {
				remainingWeeklySessions: true,
				weeklyMentorshipSessions: true,
				weeklySessionsResetAt: true
			}
		});

		const now = new Date();
		const nextMonday = new Date(now);

		// Get days until next Monday (1 = Monday, 0 = Sunday)
		const currentDay = now.getUTCDay();
		const daysUntilMonday = currentDay === 0 ? 7 : 8 - currentDay;

		nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
		nextMonday.setUTCHours(0, 0, 0, 0);

		const hasAvailableSessions = (info?.remainingWeeklySessions ?? 0) > 0;

		return {
			remainingWeeklySessions: info?.remainingWeeklySessions ?? 0,
			weeklyMentorshipSessions: info?.weeklyMentorshipSessions ?? 0,
			weeklySessionsResetAt: nextMonday,
			hasAvailableSessions
		};
	}),

	getAvailableSlots: mentorshipProcedure
		.input(getAvailableSlotsSchema)
		.query(async ({ ctx, input }) => {
			const remainingWeeklySessions = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId },
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

			const startDate = new Date(input.startDate);
			const endDate = new Date(input.endDate);

			const slots = await getAvailableSlots(startDate, endDate);

			return slots;
		}),

	getMyBookings: mentorshipProcedure.query(async ({ ctx }) => {
		const bookings = await ctx.db.mentorshipBooking.findMany({
			where: { userId: ctx.session.userId },
			orderBy: { scheduledAt: 'desc' }
		});

		return bookings;
	})
};
