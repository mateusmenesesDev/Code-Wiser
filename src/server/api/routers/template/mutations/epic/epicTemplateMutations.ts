import { epicSchema } from '~/features/epics/schemas/epics.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const epicTemplateMutations = {
	createEpic: protectedProcedure
		.input(epicSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.epic.create({
				data: {
					...input,
					projectTemplateId: input.projectTemplateId
				}
			});
		})
};
