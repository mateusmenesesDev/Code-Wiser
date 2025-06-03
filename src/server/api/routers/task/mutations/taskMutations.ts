import type { TaskStatusEnum } from '@prisma/client';
import { z } from 'zod';
import {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const taskMutations = {
	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ input, ctx }) => {
			const {
				projectTemplateSlug,
				projectSlug,
				epicId,
				sprintId,
				assigneeId,
				...rest
			} = input;
			const projectConnection = projectTemplateSlug
				? {
						projectTemplate: {
							connect: {
								slug: projectTemplateSlug
							}
						}
					}
				: {
						project: {
							connect: {
								slug: projectSlug
							}
						}
					};
			const task = await ctx.db.task.create({
				data: {
					...rest,
					...projectConnection,
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
			const { id, ...rest } = input;
			const task = await ctx.db.task.update({
				where: { id },
				data: { ...rest }
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
			await ctx.db.task.delete({ where: { id: taskId } });
		}),

	bulkDelete: protectedProcedure
		.input(
			z.object({
				taskIds: z.array(z.string())
			})
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.task.deleteMany({
				where: {
					id: {
						in: input.taskIds
					}
				}
			});
		})
};
