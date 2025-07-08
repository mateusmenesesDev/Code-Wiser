import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

const epicInclude = {
	tasks: true
};

export const epicQueries = {
	getAllByProjectId: protectedProcedure
		.input(z.object({ projectId: z.string(), isTemplate: z.boolean() }))
		.query(async ({ ctx, input }) => {
			const { projectId, isTemplate } = input;

			const epics = await ctx.db.epic.findMany({
				where: {
					projectId: isTemplate ? undefined : projectId,
					projectTemplateId: isTemplate ? projectId : undefined
				},
				include: epicInclude
			});

			return epics;
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { id } = input;

			const epic = await ctx.db.epic.findUnique({
				where: { id },
				include: epicInclude
			});

			return epic;
		})
};
