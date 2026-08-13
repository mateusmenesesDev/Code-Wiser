import { ProductVersionStatusEnum, TaskTypeEnum } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createProductVersionSchema,
	reorderProductVersionsSchema,
	updateProductVersionSchema,
	updateStoryAssignmentsSchema
} from '~/features/productVersions/schemas/productVersion.schema';
import { protectedProcedure } from '~/server/api/trpc';
import {
	assertProjectIsActive,
	assertProjectPermission,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';
import { createTRPCRouter } from '../../trpc';

const storySelect = {
	id: true,
	title: true,
	status: true,
	publicNumber: true,
	productVersionOrder: true,
	order: true
} as const;

const resourceWhere = (projectId: string, isTemplate: boolean) =>
	isTemplate ? { projectTemplateId: projectId } : { projectId };

const assertResourceAccess = async (
	ctx: Parameters<typeof userHasAccessToProject>[0],
	projectId: string,
	isTemplate: boolean,
	manage = false,
	requireActive = true
) => {
	if (isTemplate) {
		await userHasAccessToProjectTemplate(ctx, projectId);
		return;
	}

	if (manage) {
		await assertProjectPermission(ctx, projectId, 'MANAGE_VERSIONS');
	} else {
		await userHasAccessToProject(ctx, projectId);
	}
	if (requireActive) {
		await assertProjectIsActive(ctx.db, projectId);
	}
};

const getVersion = async (
	ctx: Parameters<typeof userHasAccessToProject>[0],
	id: string
) => {
	const version = await ctx.db.productVersion.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			description: true,
			order: true,
			status: true,
			projectId: true,
			projectTemplateId: true
		}
	});

	if (!version) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Product version not found'
		});
	}

	return version;
};

const assertVersionAccess = async (
	ctx: Parameters<typeof userHasAccessToProject>[0],
	version: { projectId: string | null; projectTemplateId: string | null },
	manage = false
) => {
	if (version.projectId && version.projectTemplateId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message:
				'A product version cannot belong to both a project and a template'
		});
	}
	if (version.projectTemplateId) {
		await userHasAccessToProjectTemplate(ctx, version.projectTemplateId);
		return;
	}
	if (!version.projectId) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Product version has no resource'
		});
	}
	await assertResourceAccess(ctx, version.projectId, false, manage);
};

const assertProjectVersion = (
	version: { projectId: string | null; projectTemplateId: string | null },
	message: string
) => {
	if (!version.projectId || version.projectTemplateId) {
		throw new TRPCError({ code: 'BAD_REQUEST', message });
	}
};

export const productVersionRouter = createTRPCRouter({
	getAll: protectedProcedure
		.input(
			z.object({ projectId: z.string(), isTemplate: z.boolean().optional() })
		)
		.query(async ({ ctx, input }) => {
			const isTemplate = input.isTemplate ?? false;
			await assertResourceAccess(
				ctx,
				input.projectId,
				isTemplate,
				false,
				false
			);

			const [versions, stories] = await Promise.all([
				ctx.db.productVersion.findMany({
					where: resourceWhere(input.projectId, isTemplate),
					orderBy: { order: 'asc' },
					include: {
						tasks: {
							where: { type: TaskTypeEnum.USER_STORY },
							select: storySelect,
							orderBy: { productVersionOrder: 'asc' }
						}
					}
				}),
				ctx.db.task.findMany({
					where: {
						...resourceWhere(input.projectId, isTemplate),
						type: TaskTypeEnum.USER_STORY
					},
					select: storySelect,
					orderBy: { order: 'asc' }
				})
			]);

			const assignedStoryIds = new Set(
				versions.flatMap((version) => version.tasks.map((task) => task.id))
			);
			return {
				versions,
				unassignedStories: stories.filter(
					(story) => !assignedStoryIds.has(story.id)
				)
			};
		}),

	create: protectedProcedure
		.input(createProductVersionSchema)
		.mutation(async ({ ctx, input }) => {
			await assertResourceAccess(ctx, input.projectId, input.isTemplate, true);
			const count = await ctx.db.productVersion.count({
				where: resourceWhere(input.projectId, input.isTemplate)
			});

			try {
				return await ctx.db.productVersion.create({
					data: {
						name: input.name,
						description: input.description || null,
						order: count,
						status: input.isTemplate ? null : ProductVersionStatusEnum.PLANNED,
						...(input.isTemplate
							? { projectTemplate: { connect: { id: input.projectId } } }
							: { project: { connect: { id: input.projectId } } })
					}
				});
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: `A product version named "${input.name}" already exists`
					});
				}
				throw error;
			}
		}),

	update: protectedProcedure
		.input(updateProductVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const version = await getVersion(ctx, input.id);
			await assertVersionAccess(ctx, version, true);
			try {
				return await ctx.db.productVersion.update({
					where: { id: input.id },
					data: {
						name: input.name,
						description: input.description || null
					}
				});
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: `A product version named "${input.name}" already exists`
					});
				}
				throw error;
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const version = await getVersion(ctx, input.id);
			await assertVersionAccess(ctx, version, true);
			const storyCount = await ctx.db.task.count({
				where: { productVersionId: input.id, type: TaskTypeEnum.USER_STORY }
			});
			if (storyCount > 0) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Move all User Stories out of the version before deleting it'
				});
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.productVersion.delete({ where: { id: input.id } });
				await tx.productVersion.updateMany({
					where: {
						...resourceWhere(
							version.projectId ?? version.projectTemplateId ?? '',
							Boolean(version.projectTemplateId)
						),
						order: { gt: version.order }
					},
					data: { order: { decrement: 1 } }
				});
			});
		}),

	reorder: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				isTemplate: z.boolean(),
				items: reorderProductVersionsSchema.shape.items
			})
		)
		.mutation(async ({ ctx, input }) => {
			await assertResourceAccess(ctx, input.projectId, input.isTemplate, true);
			const ids = input.items.map((item) => item.id);
			if (new Set(ids).size !== ids.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Duplicate product version'
				});
			}
			const versions = await ctx.db.productVersion.findMany({
				where: {
					id: { in: ids },
					...resourceWhere(input.projectId, input.isTemplate)
				},
				select: { id: true }
			});
			if (versions.length !== ids.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'One or more versions do not belong to this resource'
				});
			}
			await ctx.db.$transaction(
				input.items.map((item) =>
					ctx.db.productVersion.update({
						where: { id: item.id },
						data: { order: item.order }
					})
				)
			);
			return { success: true as const };
		}),

	updateStoryAssignments: protectedProcedure
		.input(updateStoryAssignmentsSchema)
		.mutation(async ({ ctx, input }) => {
			await assertResourceAccess(
				ctx,
				input.projectId,
				input.isTemplate,
				false,
				true
			);
			const taskIds = input.updates.map((update) => update.taskId);
			if (new Set(taskIds).size !== taskIds.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Duplicate User Story'
				});
			}
			const tasks = await ctx.db.task.findMany({
				where: {
					id: { in: taskIds },
					...resourceWhere(input.projectId, input.isTemplate)
				},
				select: { id: true, type: true }
			});
			if (
				tasks.length !== taskIds.length ||
				tasks.some((task) => task.type !== TaskTypeEnum.USER_STORY)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only User Stories can belong to a product version'
				});
			}

			const versionIds = [
				...new Set(
					input.updates
						.map((update) => update.versionId)
						.filter((id): id is string => id !== null)
				)
			];
			if (versionIds.length > 0) {
				const versions = await ctx.db.productVersion.findMany({
					where: {
						id: { in: versionIds },
						...resourceWhere(input.projectId, input.isTemplate)
					},
					select: { id: true }
				});
				if (versions.length !== versionIds.length) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'One or more versions do not belong to this resource'
					});
				}
			}

			await ctx.db.$transaction(
				input.updates.map((update) =>
					ctx.db.task.update({
						where: { id: update.taskId },
						data: {
							productVersionId: update.versionId,
							productVersionOrder: update.versionId ? update.order : 0
						}
					})
				)
			);
			return { success: true as const };
		}),

	start: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const version = await getVersion(ctx, input.id);
			await assertVersionAccess(ctx, version);
			assertProjectVersion(version, 'Only project versions can be started');
			if (version.status !== ProductVersionStatusEnum.PLANNED) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only a planned version can be started'
				});
			}
			return ctx.db.productVersion.update({
				where: { id: input.id },
				data: { status: ProductVersionStatusEnum.IN_PROGRESS }
			});
		}),

	complete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const version = await getVersion(ctx, input.id);
			await assertVersionAccess(ctx, version, true);
			assertProjectVersion(version, 'Only project versions can be completed');
			if (version.status !== ProductVersionStatusEnum.IN_PROGRESS) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only an in-progress version can be completed'
				});
			}
			const storyCount = await ctx.db.task.count({
				where: { productVersionId: input.id, type: TaskTypeEnum.USER_STORY }
			});
			if (storyCount === 0) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'A version needs at least one User Story before completion'
				});
			}
			return ctx.db.productVersion.update({
				where: { id: input.id },
				data: { status: ProductVersionStatusEnum.COMPLETED }
			});
		}),

	cancel: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const version = await getVersion(ctx, input.id);
			await assertVersionAccess(ctx, version, true);
			assertProjectVersion(version, 'Only project versions can be canceled');
			if (
				version.status !== ProductVersionStatusEnum.PLANNED &&
				version.status !== ProductVersionStatusEnum.IN_PROGRESS
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only planned or in-progress versions can be canceled'
				});
			}
			return ctx.db.productVersion.update({
				where: { id: input.id },
				data: { status: ProductVersionStatusEnum.CANCELED }
			});
		}),

	reopen: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const version = await getVersion(ctx, input.id);
			await assertVersionAccess(ctx, version, true);
			assertProjectVersion(version, 'Only project versions can be reopened');
			if (
				version.status !== ProductVersionStatusEnum.COMPLETED &&
				version.status !== ProductVersionStatusEnum.CANCELED
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only completed or canceled versions can be reopened'
				});
			}
			return ctx.db.productVersion.update({
				where: { id: input.id },
				data: { status: ProductVersionStatusEnum.IN_PROGRESS }
			});
		})
});
