import { Prisma, ProjectStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { projectSchema } from '~/features/projects/schemas/projects.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { upsertCategory } from '../utils/categoryUtils';
import { createProjectData } from '../utils/projectUtils';
import { upsertTechnologies } from '../utils/technologyUtils';

export const projectMutations = {
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
		}),

	changeProjectApproval: protectedProcedure
		.input(
			z.object({
				projectName: z.string(),
				approval: z.nativeEnum(ProjectStatusEnum)
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.project.update({
				where: { title: input.projectName },
				data: {
					status: input.approval
				}
			});
		}),

	changeTechnologyApproval: protectedProcedure
		.input(z.object({ technologyName: z.string(), approval: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.technology.update({
				where: { name: input.technologyName },
				data: { approved: input.approval }
			});
		}),

	changeCategoryApproval: protectedProcedure
		.input(z.object({ categoryName: z.string(), approval: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.category.update({
				where: { name: input.categoryName },
				data: { approved: input.approval }
			});
		}),

	requestChanges: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				feedback: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.project.update({
					where: { id: input.projectId },
					data: {
						status: ProjectStatusEnum.REQUESTED_CHANGES
					}
				});
			} catch (error) {
				console.error('Error requesting changes:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to request changes'
				});
			}
		})
};
