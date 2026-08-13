import { z } from 'zod';
import { filterPRReviewsSchema } from '~/features/prReview/schemas/prReview.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { assertTaskAccess } from '~/server/utils/auth';

export const prReviewQueries = {
	getAll: adminProcedure
		.input(filterPRReviewsSchema.optional())
		.query(async ({ ctx, input }) => {
			const where = {
				task: { projectId: { not: null } },
				...(input?.status && { status: input.status }),
				...(input?.userId && { requestedById: input.userId })
			};

			const reviews = await ctx.db.pullRequestReview.findMany({
				where,
				include: {
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
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
							priority: true,
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
				orderBy: [
					{ isActive: 'desc' },
					{ status: 'desc' },
					{ task: { priority: 'desc' } },
					{ createdAt: 'asc' }
				]
			});

			return reviews;
		}),

	getLatestAIAnalysis: adminProcedure
		.input(z.object({ reviewId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.prReviewAnalysis.findFirst({
				where: { reviewId: input.reviewId },
				orderBy: { createdAt: 'desc' },
				include: {
					findings: { orderBy: { displayOrder: 'asc' } }
				}
			});
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
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					reviewedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
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
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
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
