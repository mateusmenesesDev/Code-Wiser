import { z } from 'zod';
import {
	newSprintSchema,
	updateSprintOrderSchema,
	updateSprintSchema
} from '~/features/sprints/schemas/sprint.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const sprintMutations = {
	create: protectedProcedure
		.input(newSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { title, description, startDate, endDate, projectId, isTemplate } =
				input;

			const sprintCount = await ctx.db.sprint.count({
				where: isTemplate ? { projectTemplateId: projectId } : { projectId }
			});

			const createProjectConnection = (isTemplate: boolean) => {
				if (isTemplate) {
					return {
						projectTemplate: {
							connect: { id: projectId }
						}
					};
				}
				return {
					project: {
						connect: { id: projectId }
					}
				};
			};

			const sprint = await ctx.db.sprint.create({
				data: {
					title,
					description,
					startDate,
					endDate,
					order: sprintCount,
					...createProjectConnection(isTemplate)
				}
			});

			return sprint;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			await ctx.db.$transaction(async (tx) => {
				await tx.task.updateMany({
					where: { sprintId: id },
					data: { sprintId: null }
				});

				await tx.sprint.delete({ where: { id } });
			});
		}),

	update: protectedProcedure
		.input(updateSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			const sprint = await ctx.db.sprint.findUnique({
				where: { id }
			});

			if (!sprint) {
				throw new Error('Sprint not found');
			}

			return ctx.db.sprint.update({
				where: { id },
				data: updateData
			});
		}),

	updateOrder: protectedProcedure
		.input(updateSprintOrderSchema)
		.mutation(async ({ ctx, input }) => {
			const { items } = input;

			await ctx.db.$transaction(
				items.map((item) =>
					ctx.db.sprint.update({
						where: { id: item.id },
						data: { order: item.order }
					})
				)
			);
		})
};
