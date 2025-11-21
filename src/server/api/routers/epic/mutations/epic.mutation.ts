import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	newEpicSchema,
	updateEpicSchema
} from '~/features/epics/schemas/epics.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

export const epicMutations = {
	create: protectedProcedure
		.input(newEpicSchema)
		.mutation(async ({ ctx, input }) => {
			const { title, description, projectId, isTemplate } = input;

			const hasAccess = await userHasAccessToProject(ctx, projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const epic = await ctx.db.epic.create({
				data: {
					title,
					description,
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
				include: {
					project: {
						include: { members: true }
					}
				}
			});

			if (!existingEpic) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Epic not found'
				});
			}

			// Only verify access for non-template projects
			if (existingEpic.projectId) {
				const hasAccess = await userHasAccessToProject(
					ctx,
					existingEpic.projectId
				);
				if (!hasAccess) {
					throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
				}
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
			const { id, ...data } = input;

			// Verify access through existing epic
			const existingEpic = await ctx.db.epic.findUnique({
				where: { id },
				include: {
					project: {
						include: { members: true }
					}
				}
			});

			if (!existingEpic) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Epic not found'
				});
			}

			// Only verify access for non-template projects
			if (existingEpic.projectId) {
				const hasAccess = await userHasAccessToProject(
					ctx,
					existingEpic.projectId
				);
				if (!hasAccess) {
					throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
				}
			}

			await ctx.db.epic.update({
				where: { id },
				data
			});
		})
};
