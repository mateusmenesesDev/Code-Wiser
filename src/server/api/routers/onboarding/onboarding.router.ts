import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const onboardingFlowSchema = z.enum(['normal', 'mentorship']);

export const onboardingRouter = createTRPCRouter({
	getStatus: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findUnique({
			where: { id: ctx.session.userId },
			select: {
				mentorshipStatus: true,
				normalOnboardingCompletedAt: true,
				mentorshipOnboardingCompletedAt: true
			}
		});
	}),

	complete: protectedProcedure
		.input(z.object({ flow: onboardingFlowSchema }))
		.mutation(async ({ ctx, input }) => {
			const field =
				input.flow === 'normal'
					? 'normalOnboardingCompletedAt'
					: 'mentorshipOnboardingCompletedAt';

			return ctx.db.user.update({
				where: { id: ctx.session.userId },
				data: { [field]: new Date() },
				select: {
					normalOnboardingCompletedAt: true,
					mentorshipOnboardingCompletedAt: true
				}
			});
		})
});
