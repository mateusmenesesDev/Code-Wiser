import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { newSprintSchema } from '~/features/projectManagement/schemas/sprint.schema';
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
				projectSlug,
				projectTemplateSlug
			} = input;

			console.log(projectSlug);
			console.log(projectTemplateSlug);

			if (!projectSlug && !projectTemplateSlug) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Either projectSlug or projectTemplateSlug must be provided'
				});
			}

			const sprint = await ctx.db.sprint.create({
				data: {
					title,
					description,
					startDate,
					endDate,
					project: projectSlug
						? {
								connect: {
									slug: projectSlug
								}
							}
						: undefined,
					projectTemplate: projectTemplateSlug
						? {
								connect: {
									slug: projectTemplateSlug
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
		})
};
