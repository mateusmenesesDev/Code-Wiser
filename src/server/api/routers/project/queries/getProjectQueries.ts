import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const getProjectQueries = {
	getAll: protectedProcedure.query(({ ctx }) =>
		ctx.db.project.findMany({
			include: {
				category: {
					select: {
						name: true
					}
				}
			}
		})
	),

	getBySlug: protectedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const project = await ctx.db.project.findUnique({
					where: { slug: input.slug },
					include: {
						category: true,
						tasks: true,
						sprints: true,
						epics: true
					}
				});
				return project;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}),

	getEnrolled: protectedProcedure.query(({ ctx }) =>
		ctx.db.project.findMany({
			where: { members: { some: { id: ctx.session?.userId } } }
		})
	)
};
