import { protectedProcedure } from '~/server/api/trpc';
import { buildEnrolledProjectStats } from '../project/queries/enrolledProjectStats';

export const dashboardRouter = {
	getOverview: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.userId;
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
				select: { id: true, title: true }
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
			urgentTask,
			projects: projects.map((project) => ({
				...project,
				...stats[project.id]
			})),
			exercise,
			activeReview,
			latestDecision,
			booking,
			notifications
		};
	})
};
