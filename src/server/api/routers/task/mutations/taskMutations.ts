import { TaskPriorityEnum } from '@prisma/client';
import { z } from 'zod';
import {
	createTaskSchema,
	updateTaskEpicSchema,
	updateTaskSchema,
	updateTaskSprintSchema
} from '~/features/tasks/schemas/task.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const taskMutations = {
	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ input, ctx }) => {
			const { projectTemplateName, epicId, sprintId, ...rest } = input;
			const task = await ctx.db.task.create({
				data: {
					...rest,
					projectTemplate: {
						connect: {
							title: projectTemplateName
						}
					},
					epic: epicId ? { connect: { id: epicId } } : undefined,
					sprint: sprintId ? { connect: { id: sprintId } } : undefined
				}
			});
			return task;
		}),

	updatePriority: protectedProcedure
		.input(
			z.object({
				taskId: z.string(),
				priority: z.nativeEnum(TaskPriorityEnum)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { taskId, priority } = input;
			const task = await ctx.db.task.update({
				where: { id: taskId },
				data: { priority }
			});
			return task;
		}),

	updateTaskSprint: protectedProcedure
		.input(updateTaskSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, sprintId } = input;
			const task = await ctx.db.task.update({
				where: { id: taskId },
				data: { sprint: { connect: { id: sprintId } } }
			});
			return task;
		}),

	updateTaskEpic: protectedProcedure
		.input(updateTaskEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, epicId } = input;
			const task = await ctx.db.task.update({
				where: { id: taskId },
				data: { epic: { connect: { id: epicId } } }
			});
			return task;
		}),

	updateTask: protectedProcedure
		.input(updateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, ...rest } = input;
			const task = await ctx.db.task.update({
				where: { id: taskId },
				data: { ...rest }
			});
			return task;
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
