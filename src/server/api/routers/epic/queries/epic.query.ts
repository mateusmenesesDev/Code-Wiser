import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import {
	assertProjectResourceAccess,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';

const epicInclude = {
	tasks: {
		include: {
			project: { select: { publicCode: true } },
			projectTemplate: { select: { publicCode: true } }
		}
	}
};

export const epicQueries = {
	getAllByProjectId: protectedProcedure
		.input(z.object({ projectId: z.string(), isTemplate: z.boolean() }))
		.query(async ({ ctx, input }) => {
			const { projectId, isTemplate } = input;

			if (isTemplate) {
				await userHasAccessToProjectTemplate(ctx, projectId);
			} else {
				await userHasAccessToProject(ctx, projectId);
			}

			const epics = await ctx.db.epic.findMany({
				where: {
					projectId: isTemplate ? undefined : projectId,
					projectTemplateId: isTemplate ? projectId : undefined
				},
				include: epicInclude
			});

			return epics;
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { id } = input;

			const epic = await ctx.db.epic.findUnique({
				where: { id },
				include: epicInclude
			});

			if (!epic) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Epic not found'
				});
			}

			await assertProjectResourceAccess(ctx, epic);
			return epic;
		})
};
