import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	newSprintSchema,
	updateSprintOrderSchema,
	updateSprintSchema
} from '~/features/workspace/schemas/sprint.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const sprintMutations = {
	create: protectedProcedure
		.input(newSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				title,
				description,
				startDate,
				endDate,
				projectId,
				projectTemplateId
			} = input;

			if (!projectId && !projectTemplateId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Either projectId or projectTemplateId must be provided'
				});
			}

			const sprint = await ctx.db.sprint.create({
				data: {
					title,
					description,
					startDate,
					endDate,
					project: projectId
						? {
								connect: {
									id: projectId
								}
							}
						: undefined,
					projectTemplate: projectTemplateId
						? {
								connect: {
									id: projectTemplateId
								}
							}
						: undefined
				}
			});

			return sprint;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			await ctx.db.sprint.delete({ where: { id } });
		}),

	update: protectedProcedure
		.input(updateSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db.sprint.update({
				where: { id },
				data
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
