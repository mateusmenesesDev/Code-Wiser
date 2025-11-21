import { protectedProcedure } from '~/server/api/trpc';
import { kanbanDataSchema } from '../schemas';
import { TRPCError } from '@trpc/server';
import { userHasAccessToProject } from '~/server/utils/auth';

export const getKanbanQueries = {
	getKanbanData: protectedProcedure
		.input(kanbanDataSchema)
		.query(async ({ ctx, input }) => {
			const hasAccess = await userHasAccessToProject(ctx, input.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const kanbanData = await ctx.db.task.findMany({
				where: {
					projectId: input.projectId,
					sprintId: input.filters?.sprintId,
					priority: input.filters?.priority,
					assigneeId: input.filters?.assigneeId,
					epicId: input.filters?.epicId
				},
				select: {
					id: true,
					title: true,
					status: true,
					order: true,
					priority: true,
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
			return kanbanData;
		})
};
