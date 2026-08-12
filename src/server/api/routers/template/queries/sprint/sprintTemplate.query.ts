import { z } from 'zod';
import { adminProcedure } from '~/server/api/trpc';

export const sprintTemplateQueries = {
	getAllSprints: adminProcedure
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
