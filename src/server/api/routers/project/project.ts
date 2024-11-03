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

			return ctx.db.$transaction(async (prisma) => {
				const [category, technologies] = await Promise.all([
					upsertCategory(prisma, input.category),
					upsertTechnologies(prisma, input.technologies)
				]);

				return prisma.project.create({
					data: createProjectData(input, userId, category, technologies)
				});
			});
		})
});
