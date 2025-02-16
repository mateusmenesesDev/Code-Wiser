import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

const sprintInclude = {
	tasks: true
};

export const sprintQueries = {
	getAllByProjectSlug: protectedProcedure
		.input(z.object({ projectSlug: z.string() }))
		.query(async ({ ctx, input }) => {
			const { projectSlug } = input;

			const sprints = await ctx.db.sprint.findMany({
				where: { projectSlug },
				include: sprintInclude
			});

			return sprints;
		}),

	getAllByProjectTemplateSlug: protectedProcedure
		.input(z.object({ projectTemplateSlug: z.string() }))
		.query(async ({ ctx, input }) => {
			const { projectTemplateSlug } = input;

			const sprints = await ctx.db.sprint.findMany({
				where: { projectTemplateSlug },
				include: sprintInclude
			});

			return sprints;
		})
};
