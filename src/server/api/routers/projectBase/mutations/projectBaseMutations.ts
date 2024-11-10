import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const projectBaseMutations = {
	changeTechnologyApproval: protectedProcedure
		.input(z.object({ technologyName: z.string(), approval: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.technology.update({
				where: { name: input.technologyName },
				data: { approved: input.approval }
			});
		}),

	changeCategoryApproval: protectedProcedure
		.input(z.object({ categoryName: z.string(), approval: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.category.update({
				where: { name: input.categoryName },
				data: { approved: input.approval }
			});
		})
};
