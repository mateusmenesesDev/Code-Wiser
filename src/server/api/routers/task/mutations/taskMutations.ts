import { z } from 'zod';
import {
	createTaskSchema,
	updateTaskSchema
} from '~/features/tasks/schemas/task.schema';
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
