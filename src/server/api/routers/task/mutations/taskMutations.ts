import { TRPCError } from '@trpc/server';
import type { TaskStatusEnum } from '@prisma/client';
import { z } from 'zod';
import {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import { protectedProcedure } from '~/server/api/trpc';
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
			const hasAccess = await userHasAccessToProject(
				ctx,
				existingTask.projectId ?? ''
			);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

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
				}
			});
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
