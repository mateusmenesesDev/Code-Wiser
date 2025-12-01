import { TRPCError } from '@trpc/server';
import { PullRequestReviewStatusEnum } from '@prisma/client';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import {
	approvePRSchema,
	createPRReviewSchema,
	requestChangesPRSchema,
	updatePRReviewUrlSchema
} from '~/features/prReview/schemas/prReview.schema';
import { userHasAccessToProject } from '~/server/utils/auth';

export const prReviewMutations = {
	approve: adminProcedure
		.input(approvePRSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId } = input;

			const activeReview = await ctx.db.pullRequestReview.findFirst({
				where: {
					taskId,
					isActive: true
				}
			});

			if (!activeReview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'No active PR review found for this task.'
				});
			}

			await ctx.db.pullRequestReview.update({
				where: { id: activeReview.id },
				data: {
					status: PullRequestReviewStatusEnum.APPROVED
				}
			});

			return { success: true };
		}),

	requestChanges: adminProcedure
		.input(requestChangesPRSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, comment } = input;

			// Find the active review for this task
			const activeReview = await ctx.db.pullRequestReview.findFirst({
				where: {
					taskId,
					isActive: true
				}
			});

			if (!activeReview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'No active PR review found for this task.'
				});
			}

			await ctx.db.pullRequestReview.update({
				where: { id: activeReview.id },
				data: {
					status: PullRequestReviewStatusEnum.CHANGES_REQUESTED,
					comment: comment || null
				}
			});

			return { success: true };
		}),

	requestCodeReview: protectedProcedure
		.input(createPRReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, prUrl } = input;
			const reviewerId = ctx.session.userId;

			const task = await ctx.db.task.findUnique({
				where: { id: taskId },
				select: {
					project: {
						select: { id: true }
					}
				}
			});

			if (!task || !task.project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task or project not found'
				});
			}

			await userHasAccessToProject(ctx, task.project.id);

			const user = await ctx.db.user.findUnique({
				where: { id: reviewerId },
				select: {
					mentorshipStatus: true,
					credits: true
				}
			});

			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found'
				});
			}

			const CODE_REVIEW_COST = 5;
			const isMentorshipActive = user.mentorshipStatus === 'ACTIVE';

			if (!isMentorshipActive && user.credits < CODE_REVIEW_COST) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: `Insufficient credits. Code review costs ${CODE_REVIEW_COST} credits.`
				});
			}

			await ctx.db.$transaction(async (tx) => {
				if (!isMentorshipActive) {
					await tx.user.update({
						where: { id: reviewerId },
						data: { credits: { decrement: CODE_REVIEW_COST } }
					});
				}

				await tx.pullRequestReview.create({
					data: {
						taskId,
						prUrl,
						status: PullRequestReviewStatusEnum.PENDING,
						reviewedById: reviewerId,
						isActive: true
					}
				});
			});

			return { success: true, message: 'Code review requested successfully' };
		}),

	updatePRReviewUrl: protectedProcedure
		.input(updatePRReviewUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const { reviewId, prUrl } = input;

			await ctx.db.pullRequestReview.update({
				where: { id: reviewId },
				data: { prUrl }
			});

			return { success: true, message: 'PR review URL updated successfully' };
		})
};
