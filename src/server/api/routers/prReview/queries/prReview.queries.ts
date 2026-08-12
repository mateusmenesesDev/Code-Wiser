import type { PullRequestReviewStatusEnum } from '@prisma/client';
import { z } from 'zod';
import { filterPRReviewsSchema } from '~/features/prReview/schemas/prReview.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { assertTaskAccess } from '~/server/utils/auth';

export const prReviewQueries = {
	getAll: adminProcedure
		.input(filterPRReviewsSchema.optional())
		.query(async ({ ctx, input }) => {
			const where: {
				status?: PullRequestReviewStatusEnum;
				task?: {
					assignees?: { some: { id: string } };
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
					assignees: { some: { id: input.userId } }
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
							publicNumber: true,
							assignees: {
								select: {
									id: true,
									name: true,
									email: true
								}
							},
							project: {
								select: {
									id: true,
									title: true,
									publicCode: true
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
			await assertTaskAccess(ctx, input.taskId);

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
			await assertTaskAccess(ctx, input.taskId);

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
