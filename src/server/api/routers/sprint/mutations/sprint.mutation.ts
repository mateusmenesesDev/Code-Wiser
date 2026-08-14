import { Prisma, SprintStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	newSprintSchema,
	updateSprintOrderSchema,
	updateSprintSchema
} from '~/features/sprints/schemas/sprint.schema';
import { protectedProcedure } from '~/server/api/trpc';
import {
	type ResourceAccessContext,
	assertProjectIsActive,
	assertProjectPermission,
	assertProjectResourceAccess,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';
import { captureSprintSnapshot } from '../sprintMetrics';

const assertSprintManager = async (
	ctx: ResourceAccessContext,
	resource: { projectId: string | null; projectTemplateId: string | null }
) => {
	if (resource.projectTemplateId) {
		await userHasAccessToProjectTemplate(ctx, resource.projectTemplateId);
		return;
	}

	if (resource.projectId) {
		await assertProjectPermission(
			ctx,
			resource.projectId,
			'MANAGE_SPRINT_CYCLE'
		);
		return;
	}

	await assertProjectResourceAccess(ctx, resource);
};

const parseDate = (value: string | null | undefined) => {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Sprint dates must be valid calendar dates'
		});
	}
	return date;
};

const assertEditableSprint = (status: SprintStatusEnum) => {
	if (status === SprintStatusEnum.COMPLETED) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Completed sprints are historical and cannot be edited'
		});
	}
};

export const sprintMutations = {
	create: protectedProcedure
		.input(newSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { title, description, startDate, endDate, projectId, isTemplate } =
				input;

			if (isTemplate) {
				await userHasAccessToProjectTemplate(ctx, projectId);
			} else {
				await assertSprintManager(ctx, { projectId, projectTemplateId: null });
				await assertProjectIsActive(ctx.db, projectId);
			}

			const sprintCount = await ctx.db.sprint.count({
				where: isTemplate ? { projectTemplateId: projectId } : { projectId }
			});

			const sprint = await ctx.db.sprint.create({
				data: {
					title: title.trim(),
					description,
					startDate: parseDate(startDate),
					endDate: parseDate(endDate),
					order: sprintCount,
					...(isTemplate
						? { projectTemplate: { connect: { id: projectId } } }
						: { project: { connect: { id: projectId } } })
				}
			});

			return sprint;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existingSprint = await ctx.db.sprint.findUnique({
				where: { id: input.id }
			});

			if (!existingSprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found'
				});
			}

			await assertSprintManager(ctx, existingSprint);
			if (existingSprint.projectId) {
				await assertProjectIsActive(ctx.db, existingSprint.projectId);
			}
			if (existingSprint.status !== SprintStatusEnum.PLANNING) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only planning sprints can be deleted'
				});
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.task.updateMany({
					where: { sprintId: input.id },
					data: { sprintId: null }
				});
				await tx.sprint.delete({ where: { id: input.id } });
			});
		}),

	update: protectedProcedure
		.input(updateSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, startDate, endDate, title, description } = input;
			const existingSprint = await ctx.db.sprint.findUnique({ where: { id } });

			if (!existingSprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found'
				});
			}

			await assertSprintManager(ctx, existingSprint);
			assertEditableSprint(existingSprint.status);
			if (existingSprint.projectId) {
				await assertProjectIsActive(ctx.db, existingSprint.projectId);
			}

			const nextStartDate =
				startDate === undefined
					? existingSprint.startDate
					: parseDate(startDate);
			const nextEndDate =
				endDate === undefined ? existingSprint.endDate : parseDate(endDate);
			if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'End date must be on or after the start date'
				});
			}

			return ctx.db.sprint.update({
				where: { id },
				data: {
					...(title !== undefined && { title: title.trim() }),
					...(description !== undefined && { description }),
					...(startDate !== undefined && { startDate: nextStartDate }),
					...(endDate !== undefined && { endDate: nextEndDate })
				}
			});
		}),

	updateOrder: protectedProcedure
		.input(updateSprintOrderSchema)
		.mutation(async ({ ctx, input }) => {
			const sprints = await ctx.db.sprint.findMany({
				where: { id: { in: input.items.map((item) => item.id) } },
				select: {
					projectId: true,
					projectTemplateId: true,
					status: true
				}
			});
			if (sprints.length !== input.items.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'One or more sprints were not found'
				});
			}

			for (const sprint of sprints) {
				await assertSprintManager(ctx, sprint);
				assertEditableSprint(sprint.status);
				if (sprint.projectId) {
					await assertProjectIsActive(ctx.db, sprint.projectId);
				}
			}

			await ctx.db.$transaction(
				input.items.map((item) =>
					ctx.db.sprint.update({
						where: { id: item.id },
						data: { order: item.order }
					})
				)
			);
		}),

	start: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const sprint = await ctx.db.sprint.findUnique({
				where: { id: input.id }
			});
			if (!sprint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Sprint not found' });
			}

			await assertSprintManager(ctx, sprint);
			if (sprint.projectId) {
				await assertProjectIsActive(ctx.db, sprint.projectId);
			}
			if (sprint.status !== SprintStatusEnum.PLANNING) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only a planning sprint can be started'
				});
			}
			if (!sprint.startDate || !sprint.endDate) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'A sprint needs a start and end date before it can start'
				});
			}

			try {
				return await ctx.db.$transaction(async (tx) => {
					const activeSprint = await tx.sprint.findFirst({
						where: {
							...(sprint.projectId
								? { projectId: sprint.projectId }
								: { projectTemplateId: sprint.projectTemplateId }),
							status: SprintStatusEnum.ACTIVE
						}
					});
					if (activeSprint) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: `Sprint "${activeSprint.title}" is already active. Complete it before starting a new one.`
						});
					}

					const tasks = await tx.task.findMany({
						where: { sprintId: input.id },
						select: { status: true, storyPoints: true }
					});
					const committedPoints = tasks.reduce(
						(total, task) => total + (task.storyPoints ?? 0),
						0
					);
					const started = await tx.sprint.update({
						where: { id: input.id },
						data: {
							status: SprintStatusEnum.ACTIVE,
							startedAt: new Date(),
							committedPoints,
							committedTaskCount: tasks.length,
							committedUnestimatedCount: tasks.filter(
								(task) => task.storyPoints === null
							).length
						}
					});

					await captureSprintSnapshot(tx, started.id);
					return started;
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Another sprint was started at the same time'
					});
				}
				throw error;
			}
		}),

	complete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const sprint = await ctx.db.sprint.findUnique({
				where: { id: input.id }
			});
			if (!sprint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Sprint not found' });
			}

			await assertSprintManager(ctx, sprint);
			if (sprint.projectId) {
				await assertProjectIsActive(ctx.db, sprint.projectId);
			}
			if (sprint.status !== SprintStatusEnum.ACTIVE) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only an active sprint can be completed'
				});
			}

			const completedAt = new Date();
			await ctx.db.$transaction(async (tx) => {
				await captureSprintSnapshot(tx, input.id, completedAt);
				await tx.task.updateMany({
					where: { sprintId: input.id, NOT: { status: 'DONE' } },
					data: { sprintId: null }
				});
				await tx.sprint.update({
					where: { id: input.id },
					data: { status: SprintStatusEnum.COMPLETED, completedAt }
				});
			});
		})
};
