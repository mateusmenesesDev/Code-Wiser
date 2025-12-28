import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

export const taskQueries = {
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const task = await ctx.db.task.findUnique({
				where: { id: input.id },
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
				}
			});
			return task;
		}),
	getAllByProjectId: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				isTemplate: z.boolean().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const hasAccess = await userHasAccessToProject(ctx, input.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

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
		}),

	getAssigneeImage: protectedProcedure
		.input(z.object({ assigneeId: z.string() }))
		.query(async ({ input }) => {
			const assignee = await clerkClient.users.getUser(input.assigneeId);
			return assignee?.imageUrl;
		})
};
