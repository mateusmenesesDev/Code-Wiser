import type { TaskStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import { protectedProcedure } from '~/server/api/trpc';
import {
	notifyTaskAssigned,
	notifyTaskBlocked,
	notifyTaskStatusChanged
} from '~/server/services/notification/notificationService';
import { userHasAccessToProject } from '~/server/utils/auth';

type RelationshipUpdate = { connect: { id: string } } | { disconnect: true };

const createRelationshipUpdate = (
	id: string | null | undefined
): RelationshipUpdate | undefined => {
	if (id === undefined) return undefined;
	return id ? { connect: { id } } : { disconnect: true };
};

export const taskMutations = {
	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ input, ctx }) => {
			const { isTemplate, projectId, epicId, sprintId, assigneeId, ...rest } =
				input;

			const hasAccess = await userHasAccessToProject(ctx, projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const task = await ctx.db.task.create({
				data: {
					...rest,
					...(isTemplate
						? { projectTemplate: { connect: { id: projectId } } }
						: { project: { connect: { id: projectId } } }),
					assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
					epic: epicId ? { connect: { id: epicId } } : undefined,
					sprint: sprintId ? { connect: { id: sprintId } } : undefined
				}
			});
			return task;
		}),

	update: protectedProcedure
		.input(updateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				id,
				epicId,
				sprintId,
				assigneeId,
				projectId,
				isTemplate,
				...rest
			} = input;

			// Verify access through existing task
			const existingTask = await ctx.db.task.findUnique({
				where: { id },
				select: {
					id: true,
					projectId: true,
					assigneeId: true,
					status: true,
					blocked: true,
					title: true,
					project: {
						select: {
							id: true,
							title: true,
							members: {
								select: {
									id: true
								}
							}
						}
					},
					assignee: {
						select: {
							id: true,
							name: true
						}
					}
				}
			});

			if (!existingTask) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task not found'
				});
			}

			// Only verify access for non-template projects
			const hasAccess = await userHasAccessToProject(
				ctx,
				existingTask.projectId ?? ''
			);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const oldAssigneeId = existingTask.assigneeId;
			const oldStatus = existingTask.status;
			const oldBlocked = existingTask.blocked;

			const updateData = {
				...rest,
				...(createRelationshipUpdate(assigneeId) && {
					assignee: createRelationshipUpdate(assigneeId)
				}),
				...(createRelationshipUpdate(epicId) && {
					epic: createRelationshipUpdate(epicId)
				}),
				...(createRelationshipUpdate(sprintId) && {
					sprint: createRelationshipUpdate(sprintId)
				})
			};

			const task = await ctx.db.task.update({
				where: { id },
				data: {
					...updateData,
					...(input.isTemplate
						? { projectTemplate: { connect: { id: input.projectId } } }
						: { project: { connect: { id: input.projectId } } })
				},
				include: {
					assignee: {
						select: {
							id: true,
							name: true
						}
					},
					project: {
						select: {
							id: true,
							title: true
						}
					}
				}
			});

			if (existingTask.projectId && existingTask.project) {
				const changedByUser = await ctx.db.user.findUnique({
					where: { id: ctx.session.userId as string },
					select: { name: true }
				});

				const notificationPromises: Promise<void>[] = [];

				// Notify if assignee changed
				if (
					assigneeId !== undefined &&
					assigneeId !== oldAssigneeId &&
					task.assignee &&
					assigneeId
				) {
					notificationPromises.push(
						notifyTaskAssigned({
							db: ctx.db,
							taskId: task.id,
							taskTitle: task.title,
							assigneeId,
							projectId: existingTask.projectId,
							projectName: existingTask.project.title
						}).catch((error) => {
							console.error(
								'Failed to send task assigned notification:',
								error
							);
						})
					);
				}

				// Notify if status changed
				if (rest.status && rest.status !== oldStatus) {
					notificationPromises.push(
						notifyTaskStatusChanged({
							db: ctx.db,
							taskId: task.id,
							taskTitle: task.title,
							oldStatus: oldStatus ?? '',
							newStatus: rest.status,
							assigneeId: task.assigneeId,
							projectId: existingTask.projectId,
							projectName: existingTask.project.title,
							changedByUserId: ctx.session.userId as string,
							changedByName: changedByUser?.name ?? null
						}).catch((error) => {
							console.error(
								'Failed to send task status changed notification:',
								error
							);
						})
					);
				}

				// Notify if blocked status changed
				if (rest.blocked !== undefined && rest.blocked !== oldBlocked) {
					notificationPromises.push(
						notifyTaskBlocked({
							db: ctx.db,
							taskId: task.id,
							taskTitle: task.title,
							isBlocked: rest.blocked,
							assigneeId: task.assigneeId,
							projectId: existingTask.projectId,
							projectName: existingTask.project.title,
							changedByUserId: ctx.session.userId as string,
							changedByName: changedByUser?.name ?? null
						}).catch((error) => {
							console.error('Failed to send task blocked notification:', error);
						})
					);
				}

				await Promise.all(notificationPromises);
			}

			return task;
		}),

	updateTaskOrders: protectedProcedure
		.input(
			z.object({
				updates: z.array(
					z.object({
						id: z.string(),
						order: z.number(),
						status: z.string().optional()
					})
				)
			})
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.$transaction(
				input.updates.map((update) =>
					ctx.db.task.update({
						where: { id: update.id },
						data: {
							order: update.order,
							...(update.status && { status: update.status as TaskStatusEnum })
						}
					})
				)
			);
			return { success: true };
		}),

	delete: protectedProcedure
		.input(z.object({ taskId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { taskId } = input;

			// Verify access through existing task
			const existingTask = await ctx.db.task.findUnique({
				where: { id: taskId },
				include: {
					project: {
						include: { members: true }
					}
				}
			});

			if (!existingTask) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task not found'
				});
			}

			// Only verify access for non-template projects
			if (existingTask.projectId) {
				const hasAccess = await userHasAccessToProject(
					ctx,
					existingTask.projectId
				);
				if (!hasAccess) {
					throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
				}
			}

			await ctx.db.task.delete({ where: { id: taskId } });

			if (existingTask.projectId) {
				const { getBaseUrl } = await import('~/server/utils/getBaseUrl');
				const baseUrl = getBaseUrl();
				const workspaceUrl = `${baseUrl}/workspace/${existingTask.projectId}?taskId=${taskId}`;

				await ctx.db.notification.deleteMany({
					where: {
						OR: [
							{ type: 'TASK_COMMENT', link: workspaceUrl },
							{
								type: {
									in: ['PR_REQUESTED', 'PR_APPROVED', 'PR_CHANGES_REQUESTED']
								},
								link: { contains: `taskId=${taskId}` }
							}
						]
					}
				});
			}
		}),

	bulkDelete: protectedProcedure
		.input(
			z.object({
				taskIds: z.array(z.string())
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Verify access through existing tasks
			const existingTasks = await ctx.db.task.findMany({
				where: {
					id: {
						in: input.taskIds
					}
				},
				select: {
					projectId: true
				}
			});

			if (existingTasks.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Tasks not found'
				});
			}

			// Get unique projectIds (only non-template)
			const uniqueProjectIds = [
				...new Set(
					existingTasks
						.map((task) => task.projectId)
						.filter((id): id is string => id !== null)
				)
			];

			// Verify access for all unique projects
			for (const projectId of uniqueProjectIds) {
				const hasAccess = await userHasAccessToProject(ctx, projectId);
				if (!hasAccess) {
					throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
				}
			}

			return ctx.db.task.deleteMany({
				where: {
					id: {
						in: input.taskIds
					}
				}
			});
		})
};
