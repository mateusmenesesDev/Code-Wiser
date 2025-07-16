import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const taskQueries = {
	getAllByProjectId: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				isTemplate: z.boolean().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const tasks = await ctx.db.task.findMany({
				where: {
					project: {
						id: input.isTemplate ? undefined : input.projectId
					},
					projectTemplate: {
						id: input.isTemplate ? input.projectId : undefined
					}
				},
				include: {
					assignee: {
						select: {
							id: true,
							name: true
						}
					},
					sprint: {
						select: {
							id: true,
							title: true
						}
					},
					epic: {
						select: {
							id: true,
							title: true
						}
					}
				},
				orderBy: {
					order: 'asc'
				}
			});
			return tasks;
		})
};
