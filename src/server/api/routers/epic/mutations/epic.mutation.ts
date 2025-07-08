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
			const { title, description, projectId, isTemplate } = input;

			const epic = await ctx.db.epic.create({
				data: {
					title,
					description,
					project: !isTemplate
						? {
								connect: {
									id: projectId
								}
							}
						: undefined,
					projectTemplate: isTemplate
						? {
								connect: {
									id: projectId
								}
							}
						: undefined
				}
			});

			return epic;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			await ctx.db.epic.delete({ where: { id } });
		}),

	update: protectedProcedure
		.input(updateEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db.epic.update({
				where: { id },
				data
			});
		})
};
