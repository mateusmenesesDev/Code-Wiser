import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const epicTemplateQueries = {
	getEpics: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return await ctx.db.epic.findMany({
				where: {
					projectTemplateId: input
				},
				include: {
					tasks: true
				}
			});
		})
};
