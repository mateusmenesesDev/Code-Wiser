import { newEpicSchema } from '~/features/epics/schemas/epics.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const epicTemplateMutations = {
	createEpic: protectedProcedure
		.input(newEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const projectTemplateId = input.projectTemplateId;

			if (!projectTemplateId) {
				throw new Error('Project template ID is required');
			}

			return await ctx.db.epic.create({
				data: {
					...input,
					projectTemplateId
				}
			});
		})
};
