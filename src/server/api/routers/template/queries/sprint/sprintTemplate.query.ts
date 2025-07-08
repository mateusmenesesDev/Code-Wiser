import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const sprintTemplateQueries = {
	getAllSprints: protectedProcedure
		.input(z.object({ projectTemplateId: z.string() }))
		.query(async ({ ctx, input }) => {
			const sprintTemplates = await ctx.db.sprint.findMany({
				where: {
					projectTemplate: {
						id: input.projectTemplateId
					}
				},
				include: {
					tasks: true
				}
			});

			return sprintTemplates;
		})
};
