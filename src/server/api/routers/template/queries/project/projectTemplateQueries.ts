import { ProjectStatusEnum } from '@prisma/client';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const projectTemplateQueries = {
	getAll: protectedProcedure
		.input(z.object({ status: z.nativeEnum(ProjectStatusEnum) }).optional())
		.query(({ ctx, input }) =>
			ctx.db.projectTemplate.findMany({
				where: {
					status: input?.status
				},
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
			return await ctx.db.projectTemplate.findUnique({
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
					},
					tasks: true,
					epics: {
						include: {
							tasks: true
						}
					},
					sprints: true
				}
			});
		})
};
