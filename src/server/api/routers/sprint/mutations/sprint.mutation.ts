import { SprintStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	newSprintSchema,
	updateSprintOrderSchema,
	updateSprintSchema
} from '~/features/sprints/schemas/sprint.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

export const sprintMutations = {
	create: protectedProcedure
		.input(newSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { title, description, startDate, endDate, projectId, isTemplate } =
				input;

			const hasAccess = await userHasAccessToProject(ctx, projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const sprintCount = await ctx.db.sprint.count({
				where: isTemplate ? { projectTemplateId: projectId } : { projectId }
			});

			const createProjectConnection = (isTemplate: boolean) => {
				if (isTemplate) {
					return {
						projectTemplate: {
							connect: { id: projectId }
						}
					};
				}
				return {
					project: {
						connect: { id: projectId }
					}
				};
			};

		const sprint = await ctx.db.sprint.create({
			data: {
				title,
				description,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined,
				order: sprintCount,
				...createProjectConnection(isTemplate)
			}
		});

			return sprint;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			const existingSprint = await ctx.db.sprint.findUnique({
				where: { id },
				include: {
					project: {
						include: { members: true }
					}
				}
			});

			if (!existingSprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found'
				});
			}

			const hasAccess = await userHasAccessToProject(
				ctx,
				existingSprint.projectId ?? ''
			);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			if (existingSprint.status === SprintStatusEnum.ACTIVE) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message:
						'Cannot delete an active sprint. Complete it first or move tasks to backlog.'
				});
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.task.updateMany({
					where: { sprintId: id },
					data: { sprintId: null }
				});

				await tx.sprint.delete({ where: { id } });
			});
		}),

	update: protectedProcedure
		.input(updateSprintSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			// Verify access through existing sprint
			const existingSprint = await ctx.db.sprint.findUnique({
				where: { id },
				include: {
					project: {
						include: { members: true }
					}
				}
			});

			if (!existingSprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found'
				});
			}

			// Only verify access for non-template projects
			if (existingSprint.projectId) {
				const hasAccess = await userHasAccessToProject(
					ctx,
					existingSprint.projectId
				);
				if (!hasAccess) {
					throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
				}
			}

		const { startDate, endDate, ...rest } = updateData;
		return ctx.db.sprint.update({
			where: { id },
			data: {
				...rest,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined
			}
		});
		}),

	updateOrder: protectedProcedure
		.input(updateSprintOrderSchema)
		.mutation(async ({ ctx, input }) => {
			const { items } = input;

			await ctx.db.$transaction(
				items.map((item) =>
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
			const { id } = input;

			const sprint = await ctx.db.sprint.findUnique({
				where: { id },
				include: { project: { include: { members: true } } }
			});

			if (!sprint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Sprint not found' });
			}

			const hasAccess = await userHasAccessToProject(
				ctx,
				sprint.projectId ?? ''
			);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const activeSprint = await ctx.db.sprint.findFirst({
				where: {
					projectId: sprint.projectId,
					status: SprintStatusEnum.ACTIVE
				}
			});

			if (activeSprint) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: `Sprint "${activeSprint.title}" is already active. Complete it before starting a new one.`
				});
			}

			return ctx.db.sprint.update({
				where: { id },
				data: { status: SprintStatusEnum.ACTIVE }
			});
		}),

	complete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			const sprint = await ctx.db.sprint.findUnique({
				where: { id },
				include: { project: { include: { members: true } } }
			});

			if (!sprint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Sprint not found' });
			}

			const hasAccess = await userHasAccessToProject(
				ctx,
				sprint.projectId ?? ''
			);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.task.updateMany({
					where: { sprintId: id, NOT: { status: 'DONE' } },
					data: { sprintId: null }
				});

				await tx.sprint.update({
					where: { id },
					data: { status: SprintStatusEnum.COMPLETED }
				});
			});
		})
};
