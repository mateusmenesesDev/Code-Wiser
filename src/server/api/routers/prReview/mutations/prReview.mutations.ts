import { PullRequestReviewStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
	approvePRSchema,
	createPRReviewSchema,
	requestChangesPRSchema,
	updatePRReviewUrlSchema
} from '~/features/prReview/schemas/prReview.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { applyCreditTransaction } from '~/server/services/creditLedger';
import {
	notifyPRRequested,
	notifyPRResponse
} from '~/server/services/notification/notificationService';
import {
	assertProjectIsActive,
	assertTaskAccess,
	userHasAccessToProject
} from '~/server/utils/auth';

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
					requestedBy: {
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
			if (activeReview.status !== PullRequestReviewStatusEnum.PENDING) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}
			if (activeReview.task.project?.id) {
				await assertProjectIsActive(ctx.db, activeReview.task.project.id);
			}

			const decision = await ctx.db.pullRequestReview.updateMany({
				where: {
					id: activeReview.id,
					status: PullRequestReviewStatusEnum.PENDING
				},
				data: {
					status: PullRequestReviewStatusEnum.APPROVED,
					reviewedById: ctx.session.userId,
					reviewedAt: new Date()
				}
			});
			if (decision.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}

			const mentor = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId as string },
				select: { name: true }
			});

			const mentorName = mentor?.name ?? (null as string | null | undefined);

			await notifyPRResponse({
				db: ctx.db,
				memberId: activeReview.requestedById,
				memberName: activeReview.requestedBy.name,
				memberEmail: activeReview.requestedBy.email,
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
					requestedBy: {
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
			if (activeReview.status !== PullRequestReviewStatusEnum.PENDING) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}
			if (activeReview.task.project?.id) {
				await assertProjectIsActive(ctx.db, activeReview.task.project.id);
			}

			const decision = await ctx.db.pullRequestReview.updateMany({
				where: {
					id: activeReview.id,
					status: PullRequestReviewStatusEnum.PENDING
				},
				data: {
					status: PullRequestReviewStatusEnum.CHANGES_REQUESTED,
					comment: comment || null,
					reviewedById: ctx.session.userId,
					reviewedAt: new Date()
				}
			});
			if (decision.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}

			const mentor = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId as string },
				select: { name: true }
			});

			const mentorName = mentor?.name ?? (null as string | null | undefined);

			await notifyPRResponse({
				db: ctx.db,
				memberId: activeReview.requestedById,
				memberName: activeReview.requestedBy.name,
				memberEmail: activeReview.requestedBy.email,
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
			const requesterId = ctx.session.userId;
			const requestIdempotencyKey = input.idempotencyKey;

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
			await assertProjectIsActive(ctx.db, task.project.id);

			const user = await ctx.db.user.findUnique({
				where: { id: requesterId },
				select: {
					id: true,
					name: true,
					email: true,
					mentorshipStatus: true
				}
			});

			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found'
				});
			}

			const existingReview = await ctx.db.pullRequestReview.findUnique({
				where: { requestIdempotencyKey },
				select: { taskId: true, requestedById: true, prUrl: true }
			});
			if (existingReview) {
				if (
					existingReview.taskId !== taskId ||
					existingReview.requestedById !== requesterId ||
					existingReview.prUrl !== prUrl
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Review request key was already used for another review'
					});
				}
				return {
					success: true,
					message: 'Code review requested successfully'
				};
			}

			const CODE_REVIEW_COST = 5;
			const isMentorshipActive = user.mentorshipStatus === 'ACTIVE';

			await ctx.db.$transaction(async (tx) => {
				const activeReview = await tx.pullRequestReview.findFirst({
					where: { taskId, isActive: true },
					select: { id: true, status: true }
				});

				if (activeReview?.status === PullRequestReviewStatusEnum.PENDING) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'A code review is already awaiting review for this task'
					});
				}
				if (activeReview?.status === PullRequestReviewStatusEnum.APPROVED) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'This task already has an approved code review'
					});
				}

				if (activeReview) {
					await tx.pullRequestReview.update({
						where: { id: activeReview.id },
						data: { isActive: false }
					});
				}

				if (!isMentorshipActive) {
					await applyCreditTransaction(tx, {
						userId: requesterId,
						type: 'CONSUMPTION',
						value: -CODE_REVIEW_COST,
						source: 'PR_REVIEW_REQUEST',
						externalReference: taskId,
						idempotencyKey: `pr-review:${requestIdempotencyKey}`
					});
				}

				await tx.pullRequestReview.create({
					data: {
						taskId,
						prUrl,
						requestIdempotencyKey,
						status: PullRequestReviewStatusEnum.PENDING,
						requestedById: requesterId,
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

			const review = await ctx.db.pullRequestReview.findUnique({
				where: { id: reviewId },
				select: {
					taskId: true,
					requestedById: true,
					task: { select: { projectId: true } }
				}
			});
			if (!review) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'PR review not found'
				});
			}
			if (review.requestedById !== ctx.session.userId && !ctx.isAdmin) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only the requester or an admin can update this PR review'
				});
			}

			await assertTaskAccess(ctx, review.taskId);
			if (review.task.projectId) {
				await assertProjectIsActive(ctx.db, review.task.projectId);
			}

			await ctx.db.pullRequestReview.update({
				where: { id: reviewId },
				data: { prUrl }
			});

			return { success: true, message: 'PR review URL updated successfully' };
		})
};
