import { randomUUID } from 'node:crypto';
import { Prisma, ProjectStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';
import { bulkCreateSchema } from '~/features/templates/schemas/bulkCreate.schema';
import {
	cloneTemplateSchema,
	createProjectTemplateSchema,
	createTemplateVersionSchema,
	deleteTemplateSchema,
	updateTemplateBasicInfoInputSchema,
	updateTemplateStatusSchema
} from '~/features/templates/schemas/template.schema';
import { KANBAN_RANK_STEP } from '~/server/api/routers/task/mutations/taskOrderUpdates';
import { adminProcedure } from '~/server/api/trpc';
import { assertProjectTemplateIsEditable } from '~/server/utils/auth';
import {
	cloneProjectTemplate,
	templateCloneInclude
} from '../actions/cloneProjectTemplate';
import {
	createProjectTemplateData,
	getNextTemplateSortOrder
} from '../actions/projectTemplateActions';

export const projectTemplateMutations = {
	create: adminProcedure
		.input(createProjectTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const existingTemplate = await ctx.db.projectTemplate.findFirst({
					where: { title: input.title }
				});
				if (existingTemplate) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Project with this name already exists'
					});
				}

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
			await assertProjectTemplateIsEditable(ctx, projectTemplateId);

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
			await assertProjectTemplateIsEditable(ctx, projectTemplateId);

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
				await assertProjectTemplateIsEditable(ctx, input.id);
				const deleted = await ctx.db.projectTemplate.delete({
					where: { id: input.id }
				});

				return deleted.id;
			} catch (error) {
				console.error('Error deleting project template:', error);
				if (error instanceof TRPCError) throw error;
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
				where: { id },
				select: {
					id: true,
					url: true,
					projectTemplateId: true
				}
			});

			if (!image) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Image not found'
				});
			}
			if (image.projectTemplateId) {
				await assertProjectTemplateIsEditable(ctx, image.projectTemplateId);
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
				const current = await ctx.db.projectTemplate.findUnique({
					where: { id: input.id },
					select: { id: true, title: true, status: true, version: true }
				});
				if (!current) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Template not found'
					});
				}
				if (current.status === ProjectStatusEnum.APPROVED) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Published template versions are immutable'
					});
				}
				if (
					input.status === ProjectStatusEnum.APPROVED &&
					current.status !== ProjectStatusEnum.SEND_FOR_APPROVAL
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Only templates sent for approval can be published'
					});
				}
				if (
					input.status === ProjectStatusEnum.SEND_FOR_APPROVAL &&
					current.status !== ProjectStatusEnum.PENDING &&
					current.status !== ProjectStatusEnum.REQUESTED_CHANGES
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Only drafts can be sent for approval'
					});
				}
				if (
					input.status === ProjectStatusEnum.REQUESTED_CHANGES &&
					current.status !== ProjectStatusEnum.SEND_FOR_APPROVAL
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Only templates awaiting review can receive requested changes'
					});
				}
				const updated = await ctx.db.projectTemplate.update({
					where: { id: input.id },
					data: {
						status: input.status,
						publishedAt:
							input.status === ProjectStatusEnum.APPROVED ? new Date() : null,
						...(input.reviewNote !== undefined && {
							reviewNote: input.reviewNote || null
						})
					},
					select: {
						id: true,
						title: true,
						version: true,
						status: true,
						publishedAt: true,
						reviewNote: true
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
				await assertProjectTemplateIsEditable(ctx, input.id);
				const {
					id,
					category,
					technologies,
					learningOutcomes,
					milestones,
					images,
					...data
				} = input;

				const currentTemplate = await ctx.db.projectTemplate.findUnique({
					where: { id },
					select: { templateKey: true }
				});
				if (!currentTemplate) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Template not found'
					});
				}
				if (data.title) {
					const duplicate = await ctx.db.projectTemplate.findFirst({
						where: {
							title: data.title,
							NOT: { templateKey: currentTemplate.templateKey }
						},
						select: { id: true }
					});
					if (duplicate) {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'Project with this name already exists'
						});
					}
				}

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

				if (error instanceof TRPCError) {
					throw error;
				}
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
			await assertProjectTemplateIsEditable(ctx, projectTemplateId);

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
							kanbanRank:
								BigInt((taskData.order ?? taskIndex) + 1) * KANBAN_RANK_STEP,
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
				const existingTemplate = await ctx.db.projectTemplate.findFirst({
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
					include: templateCloneInclude
				});

				if (!originalTemplate) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Template not found'
					});
				}

				return await ctx.db.$transaction(async (prisma) =>
					cloneProjectTemplate(prisma, originalTemplate, {
						templateKey: randomUUID(),
						version: 1,
						status: ProjectStatusEnum.PENDING,
						sortOrder: await getNextTemplateSortOrder(prisma)
					})
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
		}),

	createVersion: adminProcedure
		.input(createTemplateVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const source = await ctx.db.projectTemplate.findUnique({
				where: { id: input.id },
				select: { templateKey: true }
			});
			if (!source) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Template not found'
				});
			}

			const latest = await ctx.db.projectTemplate.findFirst({
				where: { templateKey: source.templateKey },
				orderBy: { version: 'desc' },
				include: templateCloneInclude
			});
			if (!latest) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Template version not found'
				});
			}
			if (latest.status !== ProjectStatusEnum.APPROVED) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only an approved template can start a new version'
				});
			}

			try {
				return await ctx.db.$transaction(async (prisma) =>
					cloneProjectTemplate(prisma, latest, {
						templateKey: latest.templateKey,
						version: latest.version + 1,
						status: ProjectStatusEnum.PENDING,
						sortOrder: latest.sortOrder,
						changeSummary: input.changeSummary
					})
				);
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'A new version is being created concurrently',
						cause: error
					});
				}
				throw error;
			}
		})
};
