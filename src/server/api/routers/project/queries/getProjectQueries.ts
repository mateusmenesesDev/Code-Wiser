import { ProjectStatusEnum } from '@prisma/client';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const getProjectQueries = {
	getTechnologies: protectedProcedure
		.input(z.object({ approved: z.boolean() }).optional())
		.query(({ ctx, input }) =>
			ctx.db.technology.findMany({
				where: { approved: input?.approved }
			})
		),

	getCategories: protectedProcedure
		.input(z.object({ approved: z.boolean() }).optional())
		.query(({ ctx, input }) =>
			ctx.db.category.findMany({
				where: { approved: input?.approved }
			})
		),

	getAll: protectedProcedure
		.input(z.object({ status: z.nativeEnum(ProjectStatusEnum) }).optional())
		.query(({ ctx, input }) =>
			ctx.db.project.findMany({
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

	getByName: protectedProcedure
		.input(z.object({ name: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db.project.findUnique({
				where: { title: input.name },
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
