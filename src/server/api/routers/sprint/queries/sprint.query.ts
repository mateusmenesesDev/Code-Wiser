import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

const sprintInclude = {
	tasks: true
};

export const sprintQueries = {
	getAllByProjectId: protectedProcedure
		.input(
			z.object({ projectId: z.string(), isTemplate: z.boolean().optional() })
		)
		.query(async ({ ctx, input }) => {
			const { projectId, isTemplate = false } = input;

			const whereClause = isTemplate
				? { projectTemplate: { id: projectId } }
				: { project: { id: projectId } };

			const sprints = await ctx.db.sprint.findMany({
				where: whereClause,
				include: sprintInclude,
				orderBy: { order: 'asc' }
			});

			return sprints;
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const sprint = await ctx.db.sprint.findUnique({
				where: { id: input.id },
				include: sprintInclude
			});

			return sprint;
		})
};
