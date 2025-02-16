import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const sprintTemplateQueries = {
	getAllSprints: protectedProcedure
		.input(z.object({ projectTemplateSlug: z.string() }))
		.query(async ({ ctx, input }) => {
			const sprintTemplates = await ctx.db.sprint.findMany({
				where: {
					projectTemplate: {
						slug: input.projectTemplateSlug
					}
				},
				include: {
					tasks: true
				}
			});

			return sprintTemplates;
		})
};
