import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';
import { bulkCreateSchema } from '~/features/templates/schemas/bulkCreate.schema';
import {
	cloneTemplateSchema,
	createProjectTemplateSchema,
	deleteTemplateSchema,
	updateTemplateBasicInfoInputSchema,
	updateTemplateStatusSchema
} from '~/features/templates/schemas/template.schema';
import { generatePublicCode } from '~/lib/publicTaskId';
import { adminProcedure } from '~/server/api/trpc';
import {
	createProjectTemplateData,
	getNextTemplateSortOrder
} from '../actions/projectTemplateActions';

export const projectTemplateMutations = {
	create: adminProcedure
		.input(createProjectTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.$transaction(async (prisma) => {
					const sortOrder = await getNextTemplateSortOrder(prisma);
					const projectTemplate = await prisma.projectTemplate.create({
						data: createProjectTemplateData(input, sortOrder)
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

	reorderImages: adminProcedure
		.input(
			z.object({
				projectTemplateId: z.string(),
				items: z
					.array(
						z.object({
							id: z.string(),
							order: z.number().int().min(0)
						})
					)
					.min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { projectTemplateId, items } = input;

			const images = await ctx.db.projectImage.findMany({
				where: {
					id: { in: items.map((item) => item.id) },
					projectTemplateId
				},
				select: { id: true }
			});

			if (images.length !== items.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'One or more images do not belong to this template'
				});
			}

			await ctx.db.$transaction(
				items.map((item) =>
					ctx.db.projectImage.update({
						where: { id: item.id },
						data: { order: item.order }
					})
				)
			);

			return { success: true as const };
		}),

	reorder: adminProcedure
		.input(
			z.object({
				items: z
					.array(
						z.object({
							id: z.string(),
							sortOrder: z.number().int().min(0)
						})
					)
					.min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { items } = input;

			const templates = await ctx.db.projectTemplate.findMany({
				where: {
					id: { in: items.map((item) => item.id) }
				},
				select: { id: true }
			});

			if (templates.length !== items.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'One or more templates were not found'
				});
			}

			await ctx.db.$transaction(
				items.map((item) =>
					ctx.db.projectTemplate.update({
						where: { id: item.id },
						data: { sortOrder: item.sortOrder }
					})
				)
			);

			return { success: true as const };
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
		}),

	bulkCreateTasksSprintsEpics: adminProcedure
		.input(
			z.object({
				projectTemplateId: z.string(),
				data: bulkCreateSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { projectTemplateId, data } = input;

			return await ctx.db.$transaction(
				async (prisma) => {
					const milestones =
						(await prisma.milestone.findMany({
							where: { projectTemplateId },
							select: { id: true, title: true }
						})) ?? [];
					const milestoneTitleToId = new Map(
						milestones.map((milestone) => [milestone.title, milestone.id])
					);
					const warnings: string[] = [];
					const epicTitleToId: Record<string, string> = {};
					const epicRows = (data.epics || []).map((epicData) => {
						const id = randomUUID();
						epicTitleToId[epicData.title] = id;
						const milestoneId = epicData.milestoneTitle
							? (milestoneTitleToId.get(epicData.milestoneTitle) ?? null)
							: null;
						if (epicData.milestoneTitle && !milestoneId) {
							warnings.push(
								`Epic "${epicData.title}": Milestone "${epicData.milestoneTitle}" not found.`
							);
						}
						return {
							id,
							title: epicData.title,
							description: epicData.description,
							milestoneId,
							projectTemplateId
						};
					});

					if (epicRows.length > 0) {
						await prisma.epic.createMany({ data: epicRows });
					}

					const sprintTitleToId: Record<string, string> = {};
					const sprintCount = await prisma.sprint.count({
						where: { projectTemplateId }
					});

					const sprintRows = (data.sprints || []).map((sprintData, i) => {
						const id = randomUUID();
						sprintTitleToId[sprintData.title] = id;
						const milestoneId = sprintData.milestoneTitle
							? (milestoneTitleToId.get(sprintData.milestoneTitle) ?? null)
							: null;
						if (sprintData.milestoneTitle && !milestoneId) {
							warnings.push(
								`Sprint "${sprintData.title}": Milestone "${sprintData.milestoneTitle}" not found.`
							);
						}
						return {
							id,
							title: sprintData.title,
							description: sprintData.description,
							startDate: sprintData.startDate
								? new Date(sprintData.startDate)
								: null,
							endDate: sprintData.endDate ? new Date(sprintData.endDate) : null,
							order: sprintData.order ?? sprintCount + i,
							milestoneId,
							projectTemplateId
						};
					});

					if (sprintRows.length > 0) {
						await prisma.sprint.createMany({ data: sprintRows });
					}

					const taskCount = data.tasks?.length ?? 0;
					const publicNumberStart = taskCount
						? (
								await prisma.projectTemplate.update({
									where: { id: projectTemplateId },
									data: { nextTaskNumber: { increment: taskCount } },
									select: { nextTaskNumber: true }
								})
							).nextTaskNumber - taskCount
						: 1;

					const taskRows = (data.tasks || []).map((taskData, taskIndex) => {
						if (taskData.epicTitle && !epicTitleToId[taskData.epicTitle]) {
							warnings.push(
								`Task "${taskData.title}": Epic "${taskData.epicTitle}" not found. Task will be created without epic.`
							);
						}
						if (
							taskData.sprintTitle &&
							!sprintTitleToId[taskData.sprintTitle]
						) {
							warnings.push(
								`Task "${taskData.title}": Sprint "${taskData.sprintTitle}" not found. Task will be created without sprint.`
							);
						}

						const milestoneId = taskData.milestoneTitle
							? (milestoneTitleToId.get(taskData.milestoneTitle) ?? null)
							: null;
						if (taskData.milestoneTitle && !milestoneId) {
							warnings.push(
								`Task "${taskData.title}": Milestone "${taskData.milestoneTitle}" not found. Task will be created without milestone.`
							);
						}

						return {
							title: taskData.title,
							description: taskData.description,
							type: taskData.type,
							priority: taskData.priority,
							tags: taskData.tags || [],
							blocked: taskData.blocked ?? false,
							blockedReason: taskData.blockedReason,
							status: taskData.status,
							order: taskData.order,
							storyPoints: taskData.storyPoints,
							dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
							publicNumber: publicNumberStart + taskIndex,
							projectTemplateId,
							epicId: taskData.epicTitle
								? (epicTitleToId[taskData.epicTitle] ?? null)
								: null,
							sprintId: taskData.sprintTitle
								? (sprintTitleToId[taskData.sprintTitle] ?? null)
								: null,
							milestoneId
						};
					});

					if (taskRows.length > 0) {
						await prisma.task.createMany({ data: taskRows });
					}

					if (warnings.length > 0) {
						console.warn('Bulk create warnings:', warnings);
					}

					return {
						epicsCreated: epicRows.length,
						sprintsCreated: sprintRows.length,
						tasksCreated: taskRows.length,
						warnings: warnings.length > 0 ? warnings : undefined
					};
				},
				{
					maxWait: 10000,
					timeout: 30000
				}
			);
		}),

	clone: adminProcedure
		.input(cloneTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const existingTemplate = await ctx.db.projectTemplate.findUnique({
					where: { title: input.newTitle }
				});

				if (existingTemplate) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'A template with this title already exists'
					});
				}

				const originalTemplate = await ctx.db.projectTemplate.findUnique({
					where: { id: input.id },
					include: {
						sprints: true,
						epics: true,
						tasks: true,
						productVersions: true,
						technologies: true,
						learningOutcomes: true,
						milestones: true,
						images: {
							orderBy: { order: 'asc' }
						},
						category: true
					}
				});

				if (!originalTemplate) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Template not found'
					});
				}

				return await ctx.db.$transaction(
					async (prisma) => {
						const {
							id: _originalId,
							createdAt: _createdAt,
							updatedAt: _updatedAt,
							title: _originalTitle,
							categoryId: _categoryId,
							sortOrder: _sortOrder,
							sprints,
							epics,
							tasks,
							productVersions: templateProductVersions = [],
							technologies,
							learningOutcomes,
							milestones,
							images: _images,
							category,
							...templateData
						} = originalTemplate;

						const sortOrder = await getNextTemplateSortOrder(prisma);

						const newTemplate = await prisma.projectTemplate.create({
							data: {
								...templateData,
								title: input.newTitle,
								publicCode: generatePublicCode(input.newTitle),
								status: 'PENDING',
								sortOrder,
								category: {
									connect: { id: category.id }
								},
								technologies: {
									connect: technologies.map((tech) => ({ id: tech.id }))
								}
							}
						});

						const productVersionIdMap: Record<string, string> = {};
						if (templateProductVersions.length > 0) {
							await prisma.productVersion.createMany({
								data: templateProductVersions.map((version) => {
									const id = randomUUID();
									productVersionIdMap[version.id] = id;
									return {
										id,
										name: version.name,
										description: version.description,
										order: version.order,
										status: null,
										projectTemplateId: newTemplate.id,
										projectId: null
									};
								})
							});
						}

						const milestoneIdMap: Record<string, string> = {};
						if (learningOutcomes.length > 0) {
							await prisma.learningOutcome.createMany({
								data: learningOutcomes.map((outcome) => ({
									id: randomUUID(),
									value: outcome.value,
									projectTemplateId: newTemplate.id,
									projectId: null
								}))
							});
						}
						if (milestones.length > 0) {
							await prisma.milestone.createMany({
								data: milestones.map((milestone) => {
									const id = randomUUID();
									milestoneIdMap[milestone.id] = id;
									return {
										id,
										title: milestone.title,
										description: milestone.description,
										order: milestone.order,
										status: milestone.status,
										completed: milestone.completed,
										projectTemplateId: newTemplate.id,
										projectId: null
									};
								})
							});
						}

						const sprintIdMap: Record<string, string> = {};
						if (sprints.length > 0) {
							await prisma.sprint.createMany({
								data: sprints.map((sprint) => {
									const {
										id: oldId,
										projectTemplateId: _projectTemplateId,
										projectId: _projectId,
										milestoneId,
										createdAt: _sprintCreatedAt,
										updatedAt: _sprintUpdatedAt,
										...sprintData
									} = sprint;
									const newId = randomUUID();
									sprintIdMap[oldId] = newId;
									return {
										...sprintData,
										id: newId,
										projectTemplateId: newTemplate.id,
										projectId: null,
										milestoneId: milestoneId
											? (milestoneIdMap[milestoneId] ?? null)
											: null
									};
								})
							});
						}

						const epicIdMap: Record<string, string> = {};
						if (epics.length > 0) {
							await prisma.epic.createMany({
								data: epics.map((epic) => {
									const {
										id: oldId,
										projectTemplateId: _projectTemplateId,
										projectId: _projectId,
										milestoneId,
										createdAt: _epicCreatedAt,
										updatedAt: _epicUpdatedAt,
										...epicData
									} = epic;
									const newId = randomUUID();
									epicIdMap[oldId] = newId;
									return {
										...epicData,
										id: newId,
										projectTemplateId: newTemplate.id,
										projectId: null,
										milestoneId: milestoneId
											? (milestoneIdMap[milestoneId] ?? null)
											: null
									};
								})
							});
						}

						if (tasks.length > 0) {
							await prisma.task.createMany({
								data: tasks.map((task) => {
									const {
										id: _taskId,
										epicId,
										sprintId,
										milestoneId,
										productVersionId,
										projectTemplateId: _projectTemplateId,
										projectId: _projectId,
										createdAt: _taskCreatedAt,
										updatedAt: _taskUpdatedAt,
										...taskData
									} = task;

									return {
										...taskData,
										projectTemplateId: newTemplate.id,
										epicId: epicId ? (epicIdMap[epicId] ?? null) : null,
										sprintId: sprintId ? (sprintIdMap[sprintId] ?? null) : null,
										milestoneId: milestoneId
											? (milestoneIdMap[milestoneId] ?? null)
											: null,
										productVersionId: productVersionId
											? (productVersionIdMap[productVersionId] ?? null)
											: null,
										projectId: null
									};
								})
							});
						}

						return newTemplate.id;
					},
					{
						maxWait: 30000,
						timeout: 60000
					}
				);
			} catch (error) {
				console.error('Clone template error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === 'P2002') {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'A template with this title already exists',
							cause: error
						});
					}
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to clone template',
					cause: error
				});
			}
		})
};
