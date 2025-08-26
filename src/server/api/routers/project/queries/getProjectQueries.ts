import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const getProjectQueries = {
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				include: {
					category: true,
					epics: true,
					sprints: true,
					tasks: {
						include: {
							assignee: {
								select: {
									id: true,
									name: true
								}
							},
							sprint: {
								select: {
									id: true,
									title: true
								}
							},
							epic: {
								select: {
									id: true,
									title: true
								}
							}
						},
						orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
					}
				}
			});
			return project;
		}),

	getEnrolled: protectedProcedure.query(({ ctx }) =>
		ctx.db.project.findMany({
			where: { members: { some: { id: ctx.session?.userId } } },
			include: {
				category: {
					select: {
						name: true
					}
				}
			}
		})
	),

	getLastActivityDay: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const lastTask = await ctx.db.task.findFirst({
				where: { projectId: input.projectId },
				orderBy: { updatedAt: 'desc' },
				select: { updatedAt: true }
			});

			const result = lastTask?.updatedAt
				? lastTask.updatedAt.toISOString()
				: null;

			return result;
		}),

	getProjectProgress: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const tasks = await ctx.db.task.findMany({
				where: { projectId: input.projectId },
				select: { status: true }
			});

			const totalTasks = tasks.length;
			const completedTasks = tasks.filter(
				(task) => task.status === 'DONE'
			).length;
			const progress =
				totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

			return {
				totalTasks,
				completedTasks,
				progress
			};
		})
};
