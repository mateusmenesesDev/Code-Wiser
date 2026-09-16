import {
	LearningPlanItemStatus,
	LearningPlanItemTargetType,
	type Prisma,
	type PrismaClient
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	addLearningPlanItemSchema,
	learningPlanDetailsSchema,
	learningPlanItemSchema,
	learningPlanScopeSchema,
	reorderLearningPlanItemsSchema
} from '~/features/learningPlan/schemas/learningPlan.schema';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const MAX_PLAN_ITEMS = 50;
const MAX_CANDIDATES = 50;

type PlanDb = PrismaClient | Prisma.TransactionClient;

function resolveLearnerId(
	ctx: { session: { userId: string }; isAdmin: boolean },
	requestedLearnerId?: string
) {
	if (
		requestedLearnerId &&
		requestedLearnerId !== ctx.session.userId &&
		!ctx.isAdmin
	) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Only administrators can manage another learner plan'
		});
	}
	return requestedLearnerId ?? ctx.session.userId;
}

async function getPlan(db: PlanDb, learnerId: string) {
	return db.learningPlan.findUnique({
		where: { learnerId },
		include: {
			items: {
				take: MAX_PLAN_ITEMS,
				orderBy: { position: 'asc' },
				include: {
					dependencies: {
						select: {
							prerequisite: {
								select: { id: true, title: true, status: true }
							}
						}
					}
				}
			}
		}
	});
}

function rejectDuplicateIds(ids: string[]) {
	if (new Set(ids).size !== ids.length) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'A plan dependency cannot be repeated'
		});
	}
}

function assertDependenciesBelongToPlan(
	dependencyIds: string[],
	planItemIds: Set<string>,
	itemId?: string
) {
	rejectDuplicateIds(dependencyIds);
	if (itemId && dependencyIds.includes(itemId)) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'A plan action cannot depend on itself'
		});
	}
	if (dependencyIds.some((id) => !planItemIds.has(id))) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Every dependency must belong to the same learning plan'
		});
	}
}

function assertNoDependencyCycle(
	items: Array<{
		id: string;
		dependencies: Array<{ prerequisiteItemId: string }>;
	}>,
	itemId: string,
	dependencyIds: string[]
) {
	const prerequisitesByItem = new Map(
		items.map((item) => [
			item.id,
			item.dependencies.map((dependency) => dependency.prerequisiteItemId)
		])
	);
	prerequisitesByItem.set(itemId, dependencyIds);

	for (const dependencyId of dependencyIds) {
		const visited = new Set<string>();
		const stack = [dependencyId];
		while (stack.length > 0) {
			const currentId = stack.pop();
			if (!currentId || visited.has(currentId)) continue;
			if (currentId === itemId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Learning plan dependencies cannot form a cycle'
				});
			}
			visited.add(currentId);
			for (const prerequisiteId of prerequisitesByItem.get(currentId) ?? []) {
				stack.push(prerequisiteId);
			}
		}
	}
}

async function resolveTarget(
	db: PlanDb,
	learnerId: string,
	input: {
		targetType: LearningPlanItemTargetType;
		targetId?: string;
		targetHref?: string;
		title?: string;
	}
) {
	if (input.targetType === LearningPlanItemTargetType.CUSTOM) {
		if (input.targetId) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'A custom plan action cannot have a target id'
			});
		}
		if (!input.title?.trim()) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'A custom plan action needs a title'
			});
		}
		return {
			targetId: null,
			title: input.title.trim(),
			targetHref: input.targetHref ?? null
		};
	}

	if (input.targetType === LearningPlanItemTargetType.COHORT_EVENT) {
		if (!input.targetId) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'This cohort event action needs a target'
			});
		}
		const event = await db.cohortEvent.findFirst({
			where: {
				id: input.targetId,
				status: 'PLANNED',
				cohort: {
					status: 'ACTIVE',
					memberships: {
						some: { userId: learnerId, status: 'ACTIVE' }
					}
				}
			},
			select: { id: true, title: true }
		});
		if (!event) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Cohort event is not available to this learner'
			});
		}
		return {
			targetId: event.id,
			title: input.title?.trim() || event.title,
			targetHref: `/cohorts?eventId=${event.id}`
		};
	}

	if (input.targetType === LearningPlanItemTargetType.MENTORSHIP) {
		if (input.targetId) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'A mentorship plan action cannot have a target id'
			});
		}
		const learner = await db.user.findUnique({
			where: { id: learnerId },
			select: { mentorshipStatus: true }
		});
		if (learner?.mentorshipStatus !== 'ACTIVE') {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'This learner does not have active mentorship'
			});
		}
		return {
			targetId: null,
			title: input.title?.trim() || 'Mentorship check-in',
			targetHref: '/mentorship'
		};
	}

	if (!input.targetId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'This plan action needs a target'
		});
	}

	if (input.targetType === LearningPlanItemTargetType.TASK) {
		const task = await db.task.findFirst({
			where: {
				id: input.targetId,
				project: {
					canceledAt: null,
					memberships: {
						some: { userId: learnerId, status: 'ACTIVE' }
					}
				}
			},
			select: { id: true, title: true, projectId: true }
		});
		if (!task?.projectId) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Task is not available to this learner'
			});
		}
		return {
			targetId: task.id,
			title: input.title?.trim() || task.title,
			targetHref: `/workspace/${task.projectId}?taskId=${task.id}`
		};
	}

	if (input.targetType === LearningPlanItemTargetType.EXERCISE) {
		const challenge = await db.exerciseChallenge.findFirst({
			where: {
				id: input.targetId,
				isArchived: false,
				track: { isPublished: true }
			},
			select: {
				id: true,
				title: true,
				slug: true,
				track: { select: { slug: true } }
			}
		});
		if (!challenge) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Exercise is not available'
			});
		}
		return {
			targetId: challenge.id,
			title: input.title?.trim() || challenge.title,
			targetHref: `/exercises/${challenge.track.slug}/${challenge.slug}`
		};
	}

	const action = await db.remediationAction.findFirst({
		where: {
			id: input.targetId,
			learnerId,
			status: { not: 'CANCELLED' }
		},
		select: {
			id: true,
			title: true,
			targetType: true,
			task: { select: { id: true, projectId: true } },
			challenge: { select: { slug: true, track: { select: { slug: true } } } },
			bookingId: true
		}
	});
	if (!action) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Remediation action is not available'
		});
	}
	const targetHref =
		action.targetType === 'TASK' && action.task?.projectId
			? `/workspace/${action.task.projectId}?taskId=${action.task.id}`
			: action.targetType === 'EXERCISE' && action.challenge
				? `/exercises/${action.challenge.track.slug}/${action.challenge.slug}`
				: action.targetType === 'MENTORSHIP'
					? `/mentorship${action.bookingId ? `?bookingId=${action.bookingId}` : ''}`
					: null;
	return {
		targetId: action.id,
		title: input.title?.trim() || action.title,
		targetHref
	};
}

async function getPlanItems(db: PlanDb, planId: string) {
	return db.learningPlanItem.findMany({
		where: { planId },
		take: MAX_PLAN_ITEMS,
		orderBy: { position: 'asc' },
		select: {
			id: true,
			dependencies: { select: { prerequisiteItemId: true } }
		}
	});
}

export const learningPlanRouter = createTRPCRouter({
	get: protectedProcedure
		.input(learningPlanScopeSchema.optional())
		.query(async ({ ctx, input }) =>
			getPlan(ctx.db, resolveLearnerId(ctx, input?.learnerId))
		),

	getCandidates: protectedProcedure
		.input(learningPlanScopeSchema.optional())
		.query(async ({ ctx, input }) => {
			const learnerId = resolveLearnerId(ctx, input?.learnerId);
			const [learner, tasks, exercises, remediations, cohortEvents] =
				await Promise.all([
					ctx.db.user.findUnique({
						where: { id: learnerId },
						select: { mentorshipStatus: true }
					}),
					ctx.db.task.findMany({
						where: {
							status: { not: 'DONE' },
							project: {
								canceledAt: null,
								memberships: {
									some: { userId: learnerId, status: 'ACTIVE' }
								}
							}
						},
						take: MAX_CANDIDATES,
						orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
						select: { id: true, title: true, projectId: true }
					}),
					ctx.db.exerciseChallenge.findMany({
						where: { isArchived: false, track: { isPublished: true } },
						take: MAX_CANDIDATES,
						orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
						select: {
							id: true,
							title: true,
							slug: true,
							track: { select: { slug: true, name: true } }
						}
					}),
					ctx.db.remediationAction.findMany({
						where: { learnerId, status: { not: 'CANCELLED' } },
						take: MAX_CANDIDATES,
						orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
						select: { id: true, title: true }
					}),
					ctx.db.cohortEvent.findMany({
						where: {
							status: 'PLANNED',
							cohort: {
								status: 'ACTIVE',
								memberships: {
									some: { userId: learnerId, status: 'ACTIVE' }
								}
							}
						},
						take: MAX_CANDIDATES,
						orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
						select: { id: true, title: true, startsAt: true }
					})
				]);

			return {
				tasks: tasks.map((task) => ({
					type: LearningPlanItemTargetType.TASK,
					id: task.id,
					title: task.title,
					href: task.projectId
						? `/workspace/${task.projectId}?taskId=${task.id}`
						: null
				})),
				exercises: exercises.map((challenge) => ({
					type: LearningPlanItemTargetType.EXERCISE,
					id: challenge.id,
					title: `${challenge.track.name}: ${challenge.title}`,
					href: `/exercises/${challenge.track.slug}/${challenge.slug}`
				})),
				remediations: remediations.map((action) => ({
					type: LearningPlanItemTargetType.REMEDIATION,
					id: action.id,
					title: action.title,
					href: null
				})),
				cohortEvents: cohortEvents.map((event) => ({
					type: LearningPlanItemTargetType.COHORT_EVENT,
					id: event.id,
					title: event.title,
					href: `/cohorts?eventId=${event.id}`,
					startsAt: event.startsAt
				})),
				mentorship:
					learner?.mentorshipStatus === 'ACTIVE'
						? {
								type: LearningPlanItemTargetType.MENTORSHIP,
								id: null,
								title: 'Mentorship check-in',
								href: '/mentorship'
							}
						: null
			};
		}),

	save: protectedProcedure
		.input(
			learningPlanDetailsSchema.extend({
				learnerId: z.string().min(1).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const learnerId = resolveLearnerId(ctx, input.learnerId);
			return ctx.db.learningPlan.upsert({
				where: { learnerId },
				create: {
					learnerId,
					createdById: ctx.session.userId,
					title: input.title,
					objective: input.objective?.trim() || null
				},
				update: {
					title: input.title,
					objective: input.objective?.trim() || null
				}
			});
		}),

	addItem: protectedProcedure
		.input(addLearningPlanItemSchema)
		.mutation(async ({ ctx, input }) => {
			const learnerId = resolveLearnerId(ctx, input.learnerId);
			const target = await resolveTarget(ctx.db, learnerId, input);
			const dependencyIds = input.dependencyIds;

			const item = await ctx.db.$transaction(async (tx) => {
				const plan = await tx.learningPlan.findUnique({
					where: { learnerId },
					select: {
						id: true,
						items: { select: { id: true }, take: MAX_PLAN_ITEMS }
					}
				});
				if (!plan) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Create a learning plan before adding actions'
					});
				}
				if (plan.items.length >= MAX_PLAN_ITEMS) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: `A learning plan can contain at most ${MAX_PLAN_ITEMS} actions`
					});
				}
				assertDependenciesBelongToPlan(
					dependencyIds,
					new Set(plan.items.map((current) => current.id))
				);
				const lastItem = await tx.learningPlanItem.findFirst({
					where: { planId: plan.id },
					orderBy: { position: 'desc' },
					select: { position: true }
				});
				return tx.learningPlanItem.create({
					data: {
						planId: plan.id,
						position: (lastItem?.position ?? -1) + 1,
						title: target.title,
						reason: input.reason,
						dueAt: input.dueAt ?? null,
						targetType: input.targetType,
						targetId: target.targetId,
						targetHref: target.targetHref,
						dependencies: {
							create: dependencyIds.map((prerequisiteItemId) => ({
								prerequisiteItemId
							}))
						}
					}
				});
			});
			return item;
		}),

	updateItem: protectedProcedure
		.input(
			learningPlanItemSchema.extend({ learnerId: z.string().min(1).optional() })
		)
		.mutation(async ({ ctx, input }) => {
			const learnerId = resolveLearnerId(ctx, input.learnerId);
			if (
				input.title === undefined &&
				input.reason === undefined &&
				input.dueAt === undefined &&
				input.status === undefined &&
				input.dependencyIds === undefined
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'At least one plan action field must change'
				});
			}

			return ctx.db.$transaction(async (tx) => {
				const item = await tx.learningPlanItem.findFirst({
					where: { id: input.itemId, plan: { learnerId } },
					select: {
						id: true,
						planId: true,
						status: true,
						dependencies: { select: { prerequisiteItemId: true } }
					}
				});
				if (!item) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Plan action not found'
					});
				}

				const dependencyIds =
					input.dependencyIds ??
					item.dependencies.map((dependency) => dependency.prerequisiteItemId);
				const planItems = await getPlanItems(tx, item.planId);
				assertDependenciesBelongToPlan(
					dependencyIds,
					new Set(planItems.map((current) => current.id)),
					item.id
				);
				assertNoDependencyCycle(planItems, item.id, dependencyIds);

				const nextStatus = input.status ?? item.status;
				if (
					(nextStatus === LearningPlanItemStatus.IN_PROGRESS ||
						nextStatus === LearningPlanItemStatus.COMPLETED) &&
					dependencyIds.length > 0
				) {
					const prerequisites = await tx.learningPlanItem.findMany({
						where: { id: { in: dependencyIds } },
						select: { status: true }
					});
					if (
						prerequisites.some(
							(prerequisite) =>
								prerequisite.status !== LearningPlanItemStatus.COMPLETED
						)
					) {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'Complete every prerequisite before starting this action'
						});
					}
				}

				if (input.dependencyIds !== undefined) {
					await tx.learningPlanItemDependency.deleteMany({
						where: { itemId: item.id }
					});
				}
				return tx.learningPlanItem.update({
					where: { id: item.id },
					data: {
						...(input.title !== undefined && { title: input.title }),
						...(input.reason !== undefined && { reason: input.reason }),
						...(input.dueAt !== undefined && { dueAt: input.dueAt }),
						...(input.status !== undefined && { status: input.status }),
						...(input.dependencyIds !== undefined && {
							dependencies: {
								create: dependencyIds.map((prerequisiteItemId) => ({
									prerequisiteItemId
								}))
							}
						})
					}
				});
			});
		}),

	reorder: protectedProcedure
		.input(reorderLearningPlanItemsSchema)
		.mutation(async ({ ctx, input }) => {
			const learnerId = resolveLearnerId(ctx, input.learnerId);
			rejectDuplicateIds(input.itemIds);
			await ctx.db.$transaction(async (tx) => {
				const plan = await tx.learningPlan.findUnique({
					where: { learnerId },
					select: {
						id: true,
						items: { select: { id: true }, take: MAX_PLAN_ITEMS }
					}
				});
				if (!plan)
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Learning plan not found'
					});
				const expectedIds = new Set(plan.items.map((item) => item.id));
				if (
					input.itemIds.length !== expectedIds.size ||
					input.itemIds.some((itemId) => !expectedIds.has(itemId))
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Reorder must include every action exactly once'
					});
				}
				for (const [position, itemId] of input.itemIds.entries()) {
					await tx.learningPlanItem.update({
						where: { id: itemId },
						data: { position: -(position + 1) }
					});
				}
				for (const [position, itemId] of input.itemIds.entries()) {
					await tx.learningPlanItem.update({
						where: { id: itemId },
						data: { position }
					});
				}
			});
			return getPlan(ctx.db, learnerId);
		}),

	removeItem: protectedProcedure
		.input(
			z.object({
				learnerId: z.string().min(1).optional(),
				itemId: z.string().min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const learnerId = resolveLearnerId(ctx, input.learnerId);
			await ctx.db.$transaction(async (tx) => {
				const item = await tx.learningPlanItem.findFirst({
					where: { id: input.itemId, plan: { learnerId } },
					select: {
						id: true,
						planId: true,
						dependents: { select: { itemId: true } }
					}
				});
				if (!item)
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Plan action not found'
					});
				if (item.dependents.length > 0) {
					throw new TRPCError({
						code: 'CONFLICT',
						message:
							'Remove dependent actions before removing this prerequisite'
					});
				}
				await tx.learningPlanItem.delete({ where: { id: item.id } });
				const remaining = await tx.learningPlanItem.findMany({
					where: { planId: item.planId },
					orderBy: { position: 'asc' },
					take: MAX_PLAN_ITEMS,
					select: { id: true }
				});
				for (const [position, remainingItem] of remaining.entries()) {
					await tx.learningPlanItem.update({
						where: { id: remainingItem.id },
						data: { position }
					});
				}
			});
			return getPlan(ctx.db, learnerId);
		})
});
