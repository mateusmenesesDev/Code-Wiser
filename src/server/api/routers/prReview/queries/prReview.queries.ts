import type { PullRequestReviewStatusEnum } from '@prisma/client';
import { z } from 'zod';
import { filterPRReviewsSchema } from '~/features/prReview/schemas/prReview.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const prReviewQueries = {
	getAll: protectedProcedure
		.input(filterPRReviewsSchema.optional())
		.query(async ({ ctx, input }) => {
			const where: {
				status?: PullRequestReviewStatusEnum;
				task?: {
					assigneeId?: string;
					projectId?: { not: null };
				};
			} = {};

			where.task = {
				projectId: { not: null }
			};

			if (input?.status) {
				where.status = input.status;
			}

			if (input?.userId) {
				where.task = {
					...where.task,
					assigneeId: input.userId
				};
			}

			const reviews = await ctx.db.pullRequestReview.findMany({
				where,
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
							assignee: {
								select: {
									id: true,
									name: true,
									email: true
								}
							},
							project: {
								select: {
									id: true,
									title: true
								}
							}
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			});

			return reviews;
		}),

	getByTaskId: protectedProcedure
		.input(z.object({ taskId: z.string() }))
		.query(async ({ ctx, input }) => {
			const reviews = await ctx.db.pullRequestReview.findMany({
				where: {
					taskId: input.taskId
				},
				include: {
					reviewedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			});

			return reviews;
		}),

	getActiveByTaskId: protectedProcedure
		.input(z.object({ taskId: z.string() }))
		.query(async ({ ctx, input }) => {
			const review = await ctx.db.pullRequestReview.findFirst({
				where: {
					taskId: input.taskId,
					isActive: true
				},
				include: {
					reviewedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			return review;
		})
};
