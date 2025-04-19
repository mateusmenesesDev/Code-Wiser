import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	newEpicSchema,
	updateEpicSchema
} from '~/features/epics/schemas/epics.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const epicMutations = {
	create: protectedProcedure
		.input(newEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const { title, description, projectId, projectTemplateId } = input;

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
		.input(updateEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db.sprint.update({
				where: { id },
				data
			});
		})
};
