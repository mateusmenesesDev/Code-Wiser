import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

const epicInclude = {
	tasks: true
};

export const epicQueries = {
	getAllEpicsByProjectId: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { projectId } = input;

			const epics = await ctx.db.epic.findMany({
				where: { projectId },
				include: epicInclude
			});

			return epics;
		}),

	getAllEpicsByProjectTemplateSlug: protectedProcedure
		.input(z.object({ projectTemplateSlug: z.string() }))
		.query(async ({ ctx, input }) => {
			const { projectTemplateSlug } = input;

			const epics = await ctx.db.epic.findMany({
				where: { projectTemplate: { slug: projectTemplateSlug } },
				include: epicInclude
			});

			return epics;
		})
};
