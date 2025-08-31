import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const getProjectQueries = {
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = ctx.session;

			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				include: {
					category: true,
					epics: true,
					sprints: true,
					members: {
						select: {
							id: true
						}
					},
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

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			const isMember = project.members.some((member) => member.id === userId);

			if (!isMember && !ctx.isAdmin) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this project'
				});
			}

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

	getActiveProjects: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				cursor: z.string().nullish()
			})
		)
		.query(async ({ ctx, input }) => {
			const { limit, cursor } = input;

			const projects = await ctx.db.project.findMany({
				take: limit + 1,
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: {
					updatedAt: 'desc'
				},
				include: {
					category: true,
					tasks: {
						select: {
							id: true,
							status: true
						}
					},
					members: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			let nextCursor: typeof cursor | undefined = undefined;
			if (projects.length > limit) {
				const nextItem = projects.pop();
				if (nextItem) {
					nextCursor = nextItem.id;
				}
			}
			return { projects, nextCursor };
		}),

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
		}),

	getMembers: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = ctx.session;

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					members: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			const isMember = project.members.some((member) => member.id === userId);

			if (!isMember && !ctx.isAdmin) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this project'
				});
			}

			return project.members;
		})
};
