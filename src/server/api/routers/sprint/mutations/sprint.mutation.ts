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
					startDate,
					endDate,
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

			const hasAccess = await userHasAccessToProject(
				ctx,
				existingSprint.projectId ?? ''
			);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
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

			return ctx.db.sprint.update({
				where: { id },
				data: updateData
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
		})
};
