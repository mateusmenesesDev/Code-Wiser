import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { projectSchema } from '~/features/projects/schemas/projects.schema';
import { upsertCategory } from '~/server/api/routers/project/utils/categoryUtils';
import { createProjectData } from '~/server/api/routers/project/utils/projectUtils';
import { upsertTechnologies } from '~/server/api/routers/project/utils/technologyUtils';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { getProjectQueries } from './queries/getProjectQueries';

export const projectRouter = createTRPCRouter({
	...getProjectQueries,

	create: protectedProcedure
		.input(projectSchema)
		.mutation(async ({ ctx, input }) => {
			const { userId } = ctx.session;
			try {
				return await ctx.db.$transaction(async (prisma) => {
					const [category, technologies] = await Promise.all([
						upsertCategory(prisma, input.category),
						upsertTechnologies(prisma, input.technologies)
					]);

					return prisma.project.create({
						data: createProjectData(input, userId, category, technologies)
					});
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === 'P2002') {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'Project with this name already exists',
							cause: error
						});
					}
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred',
					cause: error
				});
			}
		})
});
