import { EpicStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	newEpicSchema,
	updateEpicSchema
} from '~/features/epics/schemas/epics.schema';
import { protectedProcedure } from '~/server/api/trpc';
import {
	assertProjectIsActive,
	assertProjectResourceAccess,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';

export const epicMutations = {
	create: protectedProcedure
		.input(newEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				title,
				description,
				status,
				startDate,
				endDate,
				projectId,
				isTemplate
			} = input;

			if (isTemplate) {
				await userHasAccessToProjectTemplate(ctx, projectId);
			} else {
				await userHasAccessToProject(ctx, projectId);
			}
			if (!isTemplate) {
				await assertProjectIsActive(ctx.db, projectId);
			}

			const epic = await ctx.db.epic.create({
				data: {
					title,
					description,
					status: status ?? EpicStatusEnum.PLANNED,
					startDate: startDate ? new Date(startDate) : undefined,
					endDate: endDate ? new Date(endDate) : undefined,
					project: !isTemplate
						? {
								connect: {
									id: projectId
								}
							}
						: undefined,
					projectTemplate: isTemplate
						? {
								connect: {
									id: projectId
								}
							}
						: undefined
				}
			});

			return epic;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			// Verify access through existing epic
			const existingEpic = await ctx.db.epic.findUnique({
				where: { id },

			});

			if (!existingEpic) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Epic not found'
				});
			}

			await assertProjectResourceAccess(ctx, existingEpic);
			if (existingEpic.projectId) {
				await assertProjectIsActive(ctx.db, existingEpic.projectId);
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.task.updateMany({
					where: { epicId: id },
					data: { epicId: null }
				});

				await tx.epic.delete({ where: { id } });
			});
		}),

	update: protectedProcedure
		.input(updateEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, startDate, endDate, ...data } = input;

			// Verify access through existing epic
			const existingEpic = await ctx.db.epic.findUnique({
				where: { id },

			});

			if (!existingEpic) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Epic not found'
				});
			}

			await assertProjectResourceAccess(ctx, existingEpic);
			if (existingEpic.projectId) {
				await assertProjectIsActive(ctx.db, existingEpic.projectId);
			}

			return ctx.db.epic.update({
				where: { id },
				data: {
					...data,
					...(startDate !== undefined && {
						startDate: startDate ? new Date(startDate) : null
					}),
					...(endDate !== undefined && {
						endDate: endDate ? new Date(endDate) : null
					})
				}
			});
		})
};
