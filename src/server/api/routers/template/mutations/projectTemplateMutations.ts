import { Prisma, ProjectStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProjectTemplateSchema } from '~/features/projects/schemas/projects.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { createProjectTemplateData } from '../actions/projectTemplateActions';

export const projectTemplateMutations = {
	create: protectedProcedure
		.input(createProjectTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.$transaction(async (prisma) => {
					const projectTemplate = await prisma.projectTemplate.create({
						data: createProjectTemplateData(input)
					});

					return projectTemplate.slug;
				});
			} catch (error) {
				console.error('Create project template error:', error);

				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === 'P2002') {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'Project with this name already exists',
							cause: error
						});
					}
					if (error.code === 'P2011') {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: 'Missing required fields',
							cause: error
						});
					}
				}

				throw error;
			}
		}),

	changeApproval: protectedProcedure
		.input(
			z.object({
				projectName: z.string(),
				approval: z.nativeEnum(ProjectStatusEnum)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const updated = await ctx.db.projectTemplate.update({
				where: { title: input.projectName },
				data: {
					status: input.approval
				},
				select: {
					title: true,
					slug: true,
					status: true
				}
			});
			return updated;
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
				return await ctx.db.projectTemplate.update({
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
