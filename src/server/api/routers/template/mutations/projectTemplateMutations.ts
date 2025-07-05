import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import slugify from 'slugify';
import {
	createProjectTemplateSchema,
	deleteTemplateSchema,
	updateTemplateBasicInfoInputSchema,
	updateTemplateStatusSchema
} from '~/features/templates/schemas/template.schema';
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

	updateStatus: protectedProcedure
		.input(updateTemplateStatusSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const updated = await ctx.db.projectTemplate.update({
					where: { id: input.id },
					data: { status: input.status },
					select: {
						id: true,
						title: true,
						slug: true,
						status: true
					}
				});

				return updated;
			} catch (error) {
				console.error('Error updating project template status:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to update project template status'
				});
			}
		}),

	delete: protectedProcedure
		.input(deleteTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const deleted = await ctx.db.projectTemplate.delete({
					where: { id: input.id }
				});

				return deleted.id;
			} catch (error) {
				console.error('Error deleting project template:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to delete project template'
				});
			}
		}),

	update: protectedProcedure
		.input(updateTemplateBasicInfoInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const {
					id,
					category,
					technologies,
					learningOutcomes,
					milestones,
					images,
					...data
				} = input;

				// Generate slug if title is being updated
				const updateData = {
					...data,
					...(data.title && { slug: slugify(data.title, { lower: true }) })
				};

				const updated = await ctx.db.projectTemplate.update({
					where: { id },
					data: {
						...updateData,
						...(category && {
							category: {
								connectOrCreate: {
									where: { name: category },
									create: { name: category }
								}
							}
						}),
						...(technologies && {
							technologies: {
								deleteMany: {},
								connectOrCreate: technologies.map((tech) => ({
									where: { name: tech },
									create: { name: tech }
								}))
							}
						}),
						...(learningOutcomes && {
							learningOutcomes: {
								deleteMany: {},
								create: learningOutcomes.map((outcome) => ({
									value: outcome
								}))
							}
						}),
						...(milestones && {
							milestones: {
								deleteMany: {},
								create: milestones.map((milestone, index) => ({
									title: milestone,
									order: index
								}))
							}
						})
					},
					include: {
						category: true,
						technologies: true,
						learningOutcomes: true,
						milestones: true
					}
				});

				return updated;
			} catch (error) {
				console.error('Error updating project template:', error);

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

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to update project template'
				});
			}
		})
};
