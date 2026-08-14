import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const MAX_RESULTS_PER_TYPE = 20;

const resourceProjectFilter = (userId: string, isAdmin: boolean) =>
	isAdmin
		? { isNot: null }
		: {
				is: {
					memberships: {
						some: { userId, status: 'ACTIVE' as const }
					}
				}
			};

const searchableText = (query: string) => ({
	OR: [
		{ title: { contains: query, mode: 'insensitive' as const } },
		{ description: { contains: query, mode: 'insensitive' as const } }
	]
});

export const searchRouter = createTRPCRouter({
	global: protectedProcedure
		.input(z.object({ query: z.string().trim().min(2).max(100) }))
		.query(async ({ ctx, input }) => {
			const projectWhere = ctx.isAdmin
				? {}
				: {
						memberships: {
							some: {
								userId: ctx.session.userId,
								status: 'ACTIVE' as const
							}
						}
					};
			const projectFilter = resourceProjectFilter(
				ctx.session.userId,
				ctx.isAdmin
			);

			const [projects, tasks, sprints, epics] = await Promise.all([
				ctx.db.project.findMany({
					where: { ...projectWhere, ...searchableText(input.query) },
					select: { id: true, title: true },
					orderBy: { title: 'asc' },
					take: MAX_RESULTS_PER_TYPE
				}),
				ctx.db.task.findMany({
					where: {
						...searchableText(input.query),
						project: projectFilter
					},
					select: {
						id: true,
						title: true,
						project: { select: { id: true, title: true } }
					},
					orderBy: { title: 'asc' },
					take: MAX_RESULTS_PER_TYPE
				}),
				ctx.db.sprint.findMany({
					where: {
						...searchableText(input.query),
						project: projectFilter
					},
					select: {
						id: true,
						title: true,
						project: { select: { id: true, title: true } }
					},
					orderBy: { title: 'asc' },
					take: MAX_RESULTS_PER_TYPE
				}),
				ctx.db.epic.findMany({
					where: {
						...searchableText(input.query),
						project: projectFilter
					},
					select: {
						id: true,
						title: true,
						project: { select: { id: true, title: true } }
					},
					orderBy: { title: 'asc' },
					take: MAX_RESULTS_PER_TYPE
				})
			]);

			return {
				projects,
				tasks: tasks.flatMap((task) =>
					task.project
						? [{ id: task.id, title: task.title, project: task.project }]
						: []
				),
				sprints: sprints.flatMap((sprint) =>
					sprint.project
						? [{ id: sprint.id, title: sprint.title, project: sprint.project }]
						: []
				),
				epics: epics.flatMap((epic) =>
					epic.project
						? [{ id: epic.id, title: epic.title, project: epic.project }]
						: []
				)
			};
		})
});
