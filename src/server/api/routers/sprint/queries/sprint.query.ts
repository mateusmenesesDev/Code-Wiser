import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

const sprintInclude = {
	tasks: {
		select: {
			id: true,
			title: true,
			status: true,
			priority: true,
			storyPoints: true,
			order: true,
			sprintId: true,
			assigneeId: true,
			assignee: {
				select: { id: true, name: true }
			}
		}
	}
};

export const sprintQueries = {
	getAllByProjectId: protectedProcedure
		.input(
			z.object({ projectId: z.string(), isTemplate: z.boolean().optional() })
		)
		.query(async ({ ctx, input }) => {
			const { projectId, isTemplate = false } = input;

			const hasAccess = await userHasAccessToProject(ctx, projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const whereClause = isTemplate
				? { projectTemplate: { id: projectId } }
				: { project: { id: projectId } };

			const sprints = await ctx.db.sprint.findMany({
				where: whereClause,
				include: sprintInclude,
				orderBy: { order: 'asc' }
			});

			return sprints.map((sprint) => {
				const taskCount = sprint.tasks.length;
				const doneCount = sprint.tasks.filter(
					(t) => t.status === 'DONE'
				).length;
				const totalPoints = sprint.tasks.reduce(
					(sum, t) => sum + (t.storyPoints ?? 0),
					0
				);
				return { ...sprint, taskCount, doneCount, totalPoints };
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { id } = input;

			const sprint = await ctx.db.sprint.findUnique({
				where: { id },
				include: sprintInclude
			});

			if (!sprint) return null;

			const taskCount = sprint.tasks.length;
			const doneCount = sprint.tasks.filter((t) => t.status === 'DONE').length;
			const totalPoints = sprint.tasks.reduce(
				(sum, t) => sum + (t.storyPoints ?? 0),
				0
			);

			return { ...sprint, taskCount, doneCount, totalPoints };
		})
};
