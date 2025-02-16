import { newSprintTemplateSchema } from '~/features/projectManagement/schemas/sprint.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const sprintTemplateMutations = {
	createSprint: protectedProcedure
		.input(newSprintTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			const { projectSlug, ...sprint } = input;

			const sprintTemplate = await ctx.db.sprint.create({
				data: {
					projectTemplate: {
						connect: {
							slug: projectSlug
						}
					},
					...sprint
				}
			});

			return sprintTemplate;
		})
};
