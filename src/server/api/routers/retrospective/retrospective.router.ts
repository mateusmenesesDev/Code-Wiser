import { Prisma, RetrospectiveCategoryEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
	addRetrospectiveItemSchema,
	createRetrospectiveSchema,
	deleteRetrospectiveItemSchema,
	toggleRetrospectiveItemSchema
} from '~/features/retrospectives/schemas/retrospective.schema';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import type { IRealtimeService } from '~/server/realtime';
import {
	type ResourceAccessContext,
	assertProjectIsActive,
	assertProjectPermission,
	getProjectMembership,
	userHasAccessToProject
} from '~/server/utils/auth';

const retrospectiveChannel = (projectId: string) =>
	`presence-retrospective-project-${projectId}`;

const publishRetrospectiveEvent = (
	ctx: { realtime: Pick<IRealtimeService, 'trigger'> },
	projectId: string,
	eventName: string,
	data: unknown
) => {
	void ctx.realtime
		.trigger(retrospectiveChannel(projectId), eventName, data)
		.catch((error: unknown) => {
			console.error(`Retrospective realtime event failed: ${eventName}`, error);
		});
};

const retrospectiveWithItems = {
	sprint: {
		select: { id: true, title: true, startDate: true, endDate: true }
	},
	items: {
		orderBy: [
			{ category: 'asc' as const },
			{ order: 'asc' as const },
			{ createdAt: 'asc' as const }
		],
		include: {
			author: { select: { id: true, name: true, imageUrl: true } }
		}
	}
};

const getRetrospective = async (ctx: ResourceAccessContext, id: string) => {
	const retrospective = await ctx.db.retrospective.findUnique({
		where: { id },
		select: { id: true, projectId: true }
	});
	if (!retrospective) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Retrospective not found'
		});
	}
	return retrospective;
};

const canManageRetrospective = async (
	ctx: ResourceAccessContext,
	projectId: string
) => {
	const membership = await getProjectMembership(ctx, projectId);
	if (!membership) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this project'
		});
	}
	return membership.permissions.includes('MANAGE_SPRINT_CYCLE');
};

const assertItemAccess = async (
	ctx: ResourceAccessContext,
	itemId: string,
	allowAnyMember = false
) => {
	const item = await ctx.db.retrospectiveItem.findUnique({
		where: { id: itemId },
		select: {
			id: true,
			authorId: true,
			category: true,
			retrospective: { select: { id: true, projectId: true } }
		}
	});
	if (!item) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Retrospective note not found'
		});
	}

	await assertProjectIsActive(ctx.db, item.retrospective.projectId);
	await userHasAccessToProject(ctx, item.retrospective.projectId);
	const canManage = await canManageRetrospective(
		ctx,
		item.retrospective.projectId
	);
	if (!allowAnyMember && !canManage && item.authorId !== ctx.session.userId) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You can only change your own retrospective notes'
		});
	}

	return item;
};

export const retrospectiveRouter = createTRPCRouter({
	getByProjectId: protectedProcedure
		.input(createRetrospectiveSchema.pick({ projectId: true }))
		.query(async ({ ctx, input }) => {
			await userHasAccessToProject(ctx, input.projectId);
			return ctx.db.retrospective.findMany({
				where: { projectId: input.projectId },
				orderBy: { createdAt: 'desc' },
				include: retrospectiveWithItems
			});
		}),

	create: protectedProcedure
		.input(createRetrospectiveSchema)
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(
				ctx,
				input.projectId,
				'MANAGE_SPRINT_CYCLE'
			);
			await assertProjectIsActive(ctx.db, input.projectId);

			const sprint = await ctx.db.sprint.findFirst({
				where: {
					id: input.sprintId,
					projectId: input.projectId
				},
				select: { id: true, status: true }
			});
			if (!sprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found in this project'
				});
			}
			if (sprint.status !== 'COMPLETED') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Retrospectives can only be started for completed sprints'
				});
			}

			try {
				const retrospective = await ctx.db.retrospective.create({
					data: {
						projectId: input.projectId,
						sprintId: input.sprintId,
						createdById: ctx.session.userId
					},
					include: retrospectiveWithItems
				});
				publishRetrospectiveEvent(
					ctx,
					input.projectId,
					'retrospective-created',
					{
						projectId: input.projectId,
						retrospectiveId: retrospective.id,
						sprintId: input.sprintId
					}
				);
				return retrospective;
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'This sprint already has a retrospective'
					});
				}
				throw error;
			}
		}),

	addItem: protectedProcedure
		.input(addRetrospectiveItemSchema)
		.mutation(async ({ ctx, input }) => {
			const retrospective = await getRetrospective(ctx, input.retrospectiveId);
			await assertProjectIsActive(ctx.db, retrospective.projectId);
			await userHasAccessToProject(ctx, retrospective.projectId);

			const order = await ctx.db.retrospectiveItem.count({
				where: {
					retrospectiveId: input.retrospectiveId,
					category: input.category
				}
			});

			const item = await ctx.db.retrospectiveItem.create({
				data: {
					retrospectiveId: input.retrospectiveId,
					category: input.category,
					content: input.content,
					order,
					authorId: ctx.session.userId
				},
				include: {
					author: { select: { id: true, name: true, imageUrl: true } }
				}
			});
			publishRetrospectiveEvent(
				ctx,
				retrospective.projectId,
				'retrospective-item-added',
				{
					projectId: retrospective.projectId,
					retrospectiveId: input.retrospectiveId,
					itemId: item.id
				}
			);
			return item;
		}),

	toggleItem: protectedProcedure
		.input(toggleRetrospectiveItemSchema)
		.mutation(async ({ ctx, input }) => {
			const item = await assertItemAccess(ctx, input.itemId, true);
			if (item.category !== RetrospectiveCategoryEnum.ACTION) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only action items can be completed'
				});
			}
			const updatedItem = await ctx.db.retrospectiveItem.update({
				where: { id: input.itemId },
				data: { completed: input.completed }
			});
			publishRetrospectiveEvent(
				ctx,
				item.retrospective.projectId,
				'retrospective-item-toggled',
				{
					projectId: item.retrospective.projectId,
					retrospectiveId: item.retrospective.id,
					itemId: input.itemId,
					completed: input.completed
				}
			);
			return updatedItem;
		}),

	deleteItem: protectedProcedure
		.input(deleteRetrospectiveItemSchema)
		.mutation(async ({ ctx, input }) => {
			const item = await assertItemAccess(ctx, input.itemId);
			await ctx.db.retrospectiveItem.delete({ where: { id: input.itemId } });
			publishRetrospectiveEvent(
				ctx,
				item.retrospective.projectId,
				'retrospective-item-deleted',
				{
					projectId: item.retrospective.projectId,
					retrospectiveId: item.retrospective.id,
					itemId: input.itemId
				}
			);
		})
});
