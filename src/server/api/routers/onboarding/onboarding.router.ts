import { z } from 'zod';
import { diagnosisSchema } from '~/features/onboarding/schemas/diagnosis.schema';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const onboardingFlowSchema = z.enum(['normal', 'mentorship']);

export const onboardingRouter = createTRPCRouter({
	getStatus: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findUnique({
			where: { id: ctx.session.userId },
			select: {
				mentorshipStatus: true,
				normalOnboardingCompletedAt: true,
				mentorshipOnboardingCompletedAt: true,
				learningGoal: true,
				selfReportedLevel: true,
				interestedTechnologies: true,
				weeklyAvailabilityBand: true,
				priorExperience: true,
				diagnosisCompletedAt: true
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
		}),

	saveDiagnosis: protectedProcedure
		.input(diagnosisSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.user.update({
				where: { id: ctx.session.userId },
				data: {
					...input,
					diagnosisCompletedAt: new Date()
				},
				select: {
					learningGoal: true,
					selfReportedLevel: true,
					interestedTechnologies: true,
					weeklyAvailabilityBand: true,
					priorExperience: true,
					diagnosisCompletedAt: true
				}
			})
		)
});
