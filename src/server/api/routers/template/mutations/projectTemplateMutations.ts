import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';
import {
	createProjectTemplateSchema,
	deleteTemplateSchema,
	updateTemplateBasicInfoInputSchema,
	updateTemplateStatusSchema
} from '~/features/templates/schemas/template.schema';
import { adminProcedure } from '~/server/api/trpc';
import { createProjectTemplateData } from '../actions/projectTemplateActions';

export const projectTemplateMutations = {
	create: adminProcedure
		.input(createProjectTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.$transaction(async (prisma) => {
					const projectTemplate = await prisma.projectTemplate.create({
						data: createProjectTemplateData(input)
					});

					return projectTemplate.id;
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

	createImage: adminProcedure
		.input(
			z.object({
				projectTemplateId: z.string(),
				images: z.array(
					z.object({
						url: z.string(),
						alt: z.string(),
						order: z.number(),
						uploadId: z.string().optional()
					})
				)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { projectTemplateId, images } = input;

			const result = await ctx.db.projectTemplate.update({
				where: { id: projectTemplateId },
				data: {
					images: {
						create: images
					}
				},
				include: {
					images: true
				}
			});

			return result;
		}),

	delete: adminProcedure
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

	deleteImage: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			const image = await ctx.db.projectImage.findUnique({
				where: { id }
			});

			if (!image) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Image not found'
				});
			}

			const fileKey = image.url.split('/').pop();

			if (!fileKey) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid file URL'
				});
			}

			try {
				const utApi = new UTApi();
				await utApi.deleteFiles(fileKey);

				const deletedImage = await ctx.db.projectImage.delete({
					where: { id }
				});

				return deletedImage.id;
			} catch (error) {
				console.error('Failed to delete from UploadThing:', error);
			}
		}),

	updateStatus: adminProcedure
		.input(updateTemplateStatusSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const updated = await ctx.db.projectTemplate.update({
					where: { id: input.id },
					data: { status: input.status },
					select: {
						id: true,
						title: true,
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

	update: adminProcedure
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

				const updated = await ctx.db.projectTemplate.update({
					where: { id },
					data: {
						...data,
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
