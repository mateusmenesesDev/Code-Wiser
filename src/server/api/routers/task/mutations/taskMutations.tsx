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
		})
};
