import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const taskQueries = {
	getAllByProjectId: protectedProcedure
		.input(
			z.object({
				projectId: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			const tasks = await ctx.db.task.findMany({
				where: {
					project: {
						id: input.projectId
					}
				}
			});
			return tasks;
		}),

	getAllByProjectTemplateId: protectedProcedure
		.input(
			z.object({
				projectTemplateId: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			const tasks = await ctx.db.task.findMany({
				where: {
					projectTemplate: {
						id: input.projectTemplateId
					}
				}
			});
			return tasks;
		})
};
