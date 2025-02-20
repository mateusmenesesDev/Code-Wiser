import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const taskQueries = {
	getAllByProjectSlug: protectedProcedure
		.input(
			z.object({
				projectSlug: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			const tasks = await ctx.db.task.findMany({
				where: {
					project: {
						slug: input.projectSlug
					}
				}
			});
			return tasks;
		}),

	getAllByProjectTemplateSlug: protectedProcedure
		.input(
			z.object({
				projectTemplateSlug: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			const tasks = await ctx.db.task.findMany({
				where: {
					projectTemplate: {
						slug: input.projectTemplateSlug
					}
				}
			});
			return tasks;
		})
};
