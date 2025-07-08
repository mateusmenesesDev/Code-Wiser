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

	getAllEpicsByProjectTemplateId: protectedProcedure
		.input(z.object({ projectTemplateId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { projectTemplateId } = input;

			const epics = await ctx.db.epic.findMany({
				where: { projectTemplate: { id: projectTemplateId } },
				include: epicInclude
			});

			return epics;
		})
};
