import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const getProjectQueries = {
	getTechnologies: protectedProcedure
		.input(z.object({ approved: z.boolean() }).optional())
		.query(({ ctx, input }) =>
			ctx.db.technology.findMany({
				where: { approved: input?.approved }
			})
		),

	getCategories: protectedProcedure
		.input(z.object({ approved: z.boolean() }).optional())
		.query(({ ctx, input }) =>
			ctx.db.category.findMany({
				where: { approved: input?.approved }
			})
		),

	getAll: protectedProcedure
		.input(z.object({ approved: z.boolean() }).optional())
		.query(({ ctx, input }) =>
			ctx.db.project.findMany({
				where: {
					approved: input?.approved
				},
				include: {
					category: {
						select: {
							name: true
						}
					}
				}
			})
		),

	getEnrolled: protectedProcedure.query(({ ctx }) =>
		ctx.db.projectEnrollment.findMany({
			where: { userId: ctx.session?.userId }
		})
	)
};
