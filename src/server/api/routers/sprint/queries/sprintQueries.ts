import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const sprintQueries = {
	getSprints: protectedProcedure
		.input(
			z.object({
				projectSlug: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			return await ctx.db.sprint.findMany({
				where: { project: { slug: input.projectSlug } },
				include: { tasks: true }
			});
		})
};
