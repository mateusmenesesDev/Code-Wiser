import { ProjectStatusEnum } from '@prisma/client';
import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const projectTemplateQueries = {
	getApproved: publicProcedure.query(({ ctx }) =>
		ctx.db.projectTemplate.findMany({
			where: { status: 'APPROVED' },
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
			try {
				const projectTemplate = await ctx.db.projectTemplate.findUnique({
					where: { slug: input.slug },
					include: {
						technologies: true,
						category: true,
						learningOutcomes: true,
						milestones: true,
						tasks: {
							orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
						},
						epics: {
							include: {
								tasks: true
							}
						},
						sprints: true
					}
				});

				return projectTemplate;
			} catch (error) {
				console.error(error);
				throw error;
			}
		})
};
