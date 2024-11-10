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
				},
				technologies: true
			}
		})
	),

	getBySlug: protectedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db.project.findUnique({
				where: { slug: input.slug },
				include: {
					technologies: true,
					category: true,
					learningOutcomes: true,
					milestones: true,
					author: {
						select: {
							id: true
						}
					}
				}
			});
		}),

	getEnrolled: protectedProcedure.query(({ ctx }) =>
		ctx.db.projectEnrollment.findMany({
			where: { userId: ctx.session?.userId }
		})
	)
};
