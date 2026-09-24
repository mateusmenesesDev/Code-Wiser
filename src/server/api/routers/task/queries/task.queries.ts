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
					parentTask: {
						select: {
							id: true,
							title: true
						}
					},
					blockedByLinks: {
						select: {
							blockingTask: {
								select: {
									id: true,
									title: true,
									publicNumber: true
								}
							}
						}
					},
					blockingLinks: {
						select: {
							blockedTask: {
								select: {
									id: true,
									title: true,
									publicNumber: true
								}
							}
						}
					},
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
					},
					subtasks: {
						orderBy: { createdAt: 'asc' },
						select: {
							id: true,
							title: true,
							status: true,
							assignees: {
								select: {
									id: true,
									name: true
								}
							}
						}
					}
				}
			});
			if (!task) return task;

			return {
				...task,
				blockedByTasks: task.blockedByLinks.map((link) => link.blockingTask),
				blockingTasks: task.blockingLinks.map((link) => link.blockedTask)
			};
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
					? { projectTemplateId: input.projectId, parentTaskId: null }
					: { projectId: input.projectId, parentTaskId: null },
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
