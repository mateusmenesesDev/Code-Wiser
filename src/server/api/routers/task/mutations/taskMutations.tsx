import { TaskPriorityEnum } from '@prisma/client';
import { z } from 'zod';
import { createTaskSchema } from '~/features/tasks/schemas/task.schema';
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
		})
};
