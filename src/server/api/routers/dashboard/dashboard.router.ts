import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import { buildEnrolledProjectStats } from '../project/queries/enrolledProjectStats';

const dashboardOverviewProcedure = protectedProcedure.input(
	z.object({ userId: z.string().min(1) }).optional()
);

export const dashboardRouter = {
	getOverview: dashboardOverviewProcedure.query(async ({ ctx, input }) => {
		const requestedUserId = input?.userId;
		const isViewingAnotherUser = Boolean(
			requestedUserId && requestedUserId !== ctx.session.userId
		);

		if (isViewingAnotherUser && !ctx.isAdmin) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only administrators can view another user dashboard'
			});
		}

		const userId = requestedUserId ?? ctx.session.userId;
		const viewedUser = isViewingAnotherUser
			? await ctx.db.user.findUnique({
					where: { id: userId },
					select: { name: true, email: true }
				})
			: null;

		if (isViewingAnotherUser && !viewedUser) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'User not found'
			});
		}

		const now = new Date();

		const [
			urgentTask,
			projects,
			exercise,
			activeReview,
			latestDecision,
			booking,
			notifications
		] = await Promise.all([
			ctx.db.task.findFirst({
				where: {
					status: { not: 'DONE' },
					project: {
						canceledAt: null,
						members: { some: { id: userId } }
					}
				},
				orderBy: [
					{ dueDate: 'asc' },
					{ priority: 'desc' },
					{ updatedAt: 'desc' }
				],
				take: 1,
				select: {
					id: true,
					title: true,
					status: true,
					priority: true,
					dueDate: true,
					project: { select: { id: true, title: true } }
				}
			}),
			ctx.db.project.findMany({
				where: {
					canceledAt: null,
					members: { some: { id: userId } }
				},
				orderBy: { updatedAt: 'desc' },
				take: 6,
				select: {
					id: true,
					title: true,
					milestones: {
						select: {
							id: true,
							tasks: { select: { id: true, status: true } },
							epics: {
								select: {
									tasks: { select: { id: true, status: true } }
								}
							},
							sprints: {
								select: {
									tasks: { select: { id: true, status: true } }
								}
							}
						}
					}
				}
			}),
			ctx.db.userChallengeProgress.findFirst({
				where: {
					userId,
					status: { in: ['IN_PROGRESS', 'IN_REVIEW', 'CHANGES_REQUESTED'] }
				},
				orderBy: { updatedAt: 'desc' },
				select: {
					status: true,
					updatedAt: true,
					challenge: {
						select: {
							id: true,
							title: true,
							slug: true,
							track: { select: { name: true, slug: true } }
						}
					}
				}
			}),
			ctx.db.pullRequestReview.findFirst({
				where: {
					requestedById: userId,
					isActive: true,
					status: { in: ['PENDING', 'CHANGES_REQUESTED'] },
					task: { projectId: { not: null } }
				},
				orderBy: { createdAt: 'asc' },
				take: 1,
				select: {
					id: true,
					status: true,
					createdAt: true,
					task: {
						select: {
							id: true,
							title: true,
							project: { select: { id: true, title: true } }
						}
					}
				}
			}),
			ctx.db.pullRequestReview.findFirst({
				where: {
					requestedById: userId,
					status: { in: ['APPROVED', 'CHANGES_REQUESTED'] },
					task: { projectId: { not: null } }
				},
				orderBy: { updatedAt: 'desc' },
				take: 1,
				select: {
					id: true,
					status: true,
					reviewedAt: true,
					comment: true,
					task: {
						select: {
							title: true,
							project: { select: { id: true, title: true } }
						}
					}
				}
			}),
			ctx.db.mentorshipBooking.findFirst({
				where: {
					userId,
					status: 'SCHEDULED',
					scheduledAt: { gte: now }
				},
				orderBy: { scheduledAt: 'asc' },
				take: 1,
				select: {
					id: true,
					scheduledAt: true,
					meetingUrl: true,
					bookingUrl: true
				}
			}),
			ctx.db.notification.findMany({
				where: { userId, read: false },
				orderBy: { createdAt: 'desc' },
				take: 5,
				select: {
					id: true,
					createdAt: true,
					title: true,
					message: true,
					link: true
				}
			})
		]);

		const projectIds = projects.map((project) => project.id);
		const [statusGroups, lastActivityGroups] = projectIds.length
			? await Promise.all([
					ctx.db.task.groupBy({
						by: ['projectId', 'status'],
						where: { projectId: { in: projectIds } },
						_count: { _all: true }
					}),
					ctx.db.task.groupBy({
						by: ['projectId'],
						where: { projectId: { in: projectIds } },
						_max: { updatedAt: true }
					})
				])
			: [[], []];

		const stats = buildEnrolledProjectStats({
			projectIds,
			statusCounts: statusGroups.map((row) => ({
				projectId: row.projectId,
				status: row.status,
				count: row._count._all
			})),
			lastActivityByProjectId: Object.fromEntries(
				lastActivityGroups
					.filter((row) => row.projectId)
					.map((row) => [row.projectId, row._max.updatedAt])
			)
		});

		return {
			...(viewedUser ? { viewedUser } : {}),
			urgentTask,
			projects: projects.map((project) => {
				const milestones = project.milestones ?? [];
				const milestoneStats = milestones.map((milestone) => {
					const tasks = [
						...milestone.tasks,
						...milestone.epics.flatMap((epic) => epic.tasks),
						...milestone.sprints.flatMap((sprint) => sprint.tasks)
					];
					const uniqueTasks = [
						...new Map(tasks.map((task) => [task.id, task])).values()
					];
					const completedTasks = uniqueTasks.filter(
						(task) => task.status === 'DONE'
					).length;
					return {
						taskCount: uniqueTasks.length,
						completedTasks,
						completed:
							uniqueTasks.length > 0 && completedTasks === uniqueTasks.length
					};
				});
				const roadmapTaskCount = milestoneStats.reduce(
					(total, milestone) => total + milestone.taskCount,
					0
				);
				const roadmapCompletedTasks = milestoneStats.reduce(
					(total, milestone) => total + milestone.completedTasks,
					0
				);
				const hasRoadmap = milestones.length > 0;

				return {
					id: project.id,
					title: project.title,
					...(hasRoadmap
						? {
								progress: roadmapTaskCount
									? Math.round((roadmapCompletedTasks / roadmapTaskCount) * 100)
									: 0,
								totalTasks: roadmapTaskCount,
								completedTasks: roadmapCompletedTasks,
								completedMilestones: milestoneStats.filter(
									(milestone) => milestone.completed
								).length,
								totalMilestones: milestones.length,
								usesRoadmap: true as const
							}
						: {
								...stats[project.id],
								usesRoadmap: false as const,
								completedMilestones: 0,
								totalMilestones: 0
							})
				};
			}),
			exercise,
			activeReview,
			latestDecision,
			booking,
			notifications
		};
	})
};
