import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import {
	assertTaskAccess,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';

export const taskQueries = {
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await assertTaskAccess(ctx, input.id);

			const task = await ctx.db.task.findUnique({
				where: { id: input.id },
				include: {
					project: { select: { publicCode: true } },
					projectTemplate: { select: { publicCode: true } },
					assignees: {
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
			if (input.isTemplate) {
				await userHasAccessToProjectTemplate(ctx, input.projectId);
			} else {
				await userHasAccessToProject(ctx, input.projectId);
			}

			const tasks = await ctx.db.task.findMany({
				where: input.isTemplate
					? { projectTemplateId: input.projectId }
					: { projectId: input.projectId },
				include: {
					project: { select: { publicCode: true } },
					projectTemplate: { select: { publicCode: true } },
					assignees: {
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
			try {
				const assignee = await clerkClient.users.getUser(input.assigneeId);
				return assignee?.imageUrl ?? null;
			} catch {
				return null;
			}
		})
};
