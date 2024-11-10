import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const projectBaseQueries = {
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
		)
};
