import { PullRequestReviewStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
	approvePRSchema,
	createPRReviewSchema,
	requestChangesPRSchema,
	updatePRReviewUrlSchema
} from '~/features/prReview/schemas/prReview.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import {
	notifyPRRequested,
	notifyPRResponse
} from '~/server/services/notification/notificationService';
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
				},
				include: {
					reviewedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					task: {
						select: {
							id: true,
							title: true,
							project: {
								select: {
									id: true,
									title: true
								}
							}
						}
					}
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

			const mentor = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId as string },
				select: { name: true }
			});

			const mentorName = mentor?.name ?? (null as string | null | undefined);

			await notifyPRResponse({
				db: ctx.db,
				memberId: activeReview.reviewedById,
				memberName: activeReview.reviewedBy.name,
				memberEmail: activeReview.reviewedBy.email,
				mentorName,
				projectId: activeReview.task.project?.id ?? '',
				projectName: activeReview.task.project?.title ?? '',
				taskId: activeReview.task.id,
				taskTitle: activeReview.task.title,
				status: 'APPROVED'
			}).catch((error) => {
				console.error('Failed to send notification:', error);
			});

			return { success: true };
		}),

	requestChanges: adminProcedure
		.input(requestChangesPRSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, comment } = input;

			const activeReview = await ctx.db.pullRequestReview.findFirst({
				where: {
					taskId,
					isActive: true
				},
				include: {
					reviewedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					task: {
						select: {
							id: true,
							title: true,
							project: {
								select: {
									id: true,
									title: true
								}
							}
						}
					}
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

			const mentor = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId as string },
				select: { name: true }
			});

			const mentorName = mentor?.name ?? (null as string | null | undefined);

			await notifyPRResponse({
				db: ctx.db,
				memberId: activeReview.reviewedById,
				memberName: activeReview.reviewedBy.name,
				memberEmail: activeReview.reviewedBy.email,
				mentorName,
				projectId: activeReview.task.project?.id ?? '',
				projectName: activeReview.task.project?.title ?? '',
				taskId: activeReview.task.id,
				taskTitle: activeReview.task.title,
				status: 'CHANGES_REQUESTED',
				comment: comment || null
			}).catch((error) => {
				console.error('Failed to send notification:', error);
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
					id: true,
					title: true,
					project: {
						select: {
							id: true,
							title: true
						}
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
					id: true,
					name: true,
					email: true,
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

			await notifyPRRequested({
				db: ctx.db,
				memberName: user.name,
				projectId: task.project.id,
				projectName: task.project.title,
				taskId: task.id,
				taskTitle: task.title,
				prUrl
			}).catch((error) => {
				console.error('Failed to send notification:', error);
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
