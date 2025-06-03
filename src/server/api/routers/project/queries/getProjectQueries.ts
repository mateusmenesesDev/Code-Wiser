import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const getProjectQueries = {
	getAll: publicProcedure.query(({ ctx }) =>
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

	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const project = await ctx.db.project.findUnique({
					where: { slug: input.slug },
					include: {
						category: true,
						tasks: {
							orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
						},
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
