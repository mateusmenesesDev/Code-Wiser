import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const MAX_PROJECTS = 100;
const MAX_LEARNERS_PER_PROJECT = 200;
const MAX_PENDING_ITEMS_PER_SOURCE = 500;
const MAX_UPCOMING_SESSIONS = 500;

type PendingItem = {
	id: string;
	type: 'PR_REVIEW' | 'OVERDUE_TASK' | 'OVERDUE_SPRINT';
	title: string;
	context: string;
	projectId: string;
	projectTitle: string;
	occurredAt: Date;
	dueDate: Date | null;
	href: string;
};

function sortPendingItems(items: PendingItem[]) {
	return items.sort(
		(a, b) =>
			a.occurredAt.getTime() - b.occurredAt.getTime() ||
			a.type.localeCompare(b.type) ||
			a.id.localeCompare(b.id)
	);
}

export const mentorFollowUpRouter = createTRPCRouter({
	getAccess: protectedProcedure.query(async ({ ctx }) => {
		const count = await ctx.db.projectMembership.count({
			where: {
				userId: ctx.session.userId,
				role: 'MENTOR',
				status: 'ACTIVE',
				project: { canceledAt: null }
			}
		});

		return count > 0;
	}),

	getOverview: protectedProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const projects = await ctx.db.project.findMany({
			where: {
				canceledAt: null,
				memberships: {
					some: {
						userId: ctx.session.userId,
						role: 'MENTOR',
						status: 'ACTIVE'
					}
				}
			},
			orderBy: { title: 'asc' },
			take: MAX_PROJECTS + 1,
			select: {
				id: true,
				title: true,
				memberships: {
					where: { role: 'LEARNER', status: 'ACTIVE' },
					orderBy: { user: { name: 'asc' } },
					take: MAX_LEARNERS_PER_PROJECT + 1,
					select: {
						userId: true,
						user: { select: { id: true, name: true, email: true } }
					}
				}
			}
		});

		if (projects.length === 0) {
			return {
				projects: [],
				mentorandos: [],
				projectPendingItems: [],
				hasMore: false
			};
		}

		const visibleProjects = projects.slice(0, MAX_PROJECTS);
		const projectIds = visibleProjects.map((project) => project.id);
		const learnerIdsByProject = new Map<string, Set<string>>();
		const learnerById = new Map<
			string,
			{ id: string; name: string | null; email: string }
		>();
		let hasMore = projects.length > MAX_PROJECTS;

		for (const project of visibleProjects) {
			if (project.memberships.length > MAX_LEARNERS_PER_PROJECT) {
				hasMore = true;
			}
			const memberships = project.memberships.slice(
				0,
				MAX_LEARNERS_PER_PROJECT
			);
			learnerIdsByProject.set(
				project.id,
				new Set(memberships.map((membership) => membership.userId))
			);
			for (const membership of memberships) {
				learnerById.set(membership.user.id, membership.user);
			}
		}

		const learnerIds = [...learnerById.keys()];
		const [
			reviews,
			overdueTasks,
			overdueSprints,
			statusGroups,
			activityGroups,
			bookings
		] = await Promise.all([
			ctx.db.pullRequestReview.findMany({
				where: {
					isActive: true,
					status: 'PENDING',
					task: { projectId: { in: projectIds } }
				},
				orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
				take: MAX_PENDING_ITEMS_PER_SOURCE + 1,
				select: {
					id: true,
					createdAt: true,
					requestedBy: {
						select: { id: true, name: true, email: true }
					},
					task: {
						select: {
							id: true,
							title: true,
							projectId: true,
							project: { select: { id: true, title: true } }
						}
					}
				}
			}),
			ctx.db.task.findMany({
				where: {
					projectId: { in: projectIds },
					status: { not: 'DONE' },
					dueDate: { not: null, lt: now }
				},
				orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
				take: MAX_PENDING_ITEMS_PER_SOURCE + 1,
				select: {
					id: true,
					title: true,
					dueDate: true,
					projectId: true,
					project: { select: { id: true, title: true } },
					sprint: { select: { id: true, title: true } },
					assignees: {
						select: { id: true, name: true, email: true }
					}
				}
			}),
			ctx.db.sprint.findMany({
				where: {
					projectId: { in: projectIds },
					status: 'ACTIVE',
					endDate: { not: null, lt: now }
				},
				orderBy: [{ endDate: 'asc' }, { id: 'asc' }],
				take: MAX_PENDING_ITEMS_PER_SOURCE + 1,
				select: {
					id: true,
					title: true,
					endDate: true,
					projectId: true,
					project: { select: { id: true, title: true } }
				}
			}),
			ctx.db.task.groupBy({
				by: ['projectId', 'status'],
				where: { projectId: { in: projectIds } },
				_count: { _all: true }
			}),
			ctx.db.task.groupBy({
				by: ['projectId'],
				where: { projectId: { in: projectIds } },
				_max: { updatedAt: true }
			}),
			learnerIds.length
				? ctx.db.mentorshipBooking.findMany({
						where: {
							userId: { in: learnerIds },
							status: 'SCHEDULED',
							scheduledAt: { gte: now }
						},
						orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
						take: MAX_UPCOMING_SESSIONS + 1,
						select: {
							id: true,
							userId: true,
							scheduledAt: true,
							objective: true
						}
					})
				: []
		]);

		if (
			reviews.length > MAX_PENDING_ITEMS_PER_SOURCE ||
			overdueTasks.length > MAX_PENDING_ITEMS_PER_SOURCE ||
			overdueSprints.length > MAX_PENDING_ITEMS_PER_SOURCE ||
			bookings.length > MAX_UPCOMING_SESSIONS
		) {
			hasMore = true;
		}

		const projectStats = new Map(
			projectIds.map((projectId) => [
				projectId,
				{
					totalTasks: 0,
					completedTasks: 0,
					lastActivityAt: null as Date | null
				}
			])
		);
		for (const row of statusGroups) {
			const stats = projectStats.get(row.projectId ?? '');
			if (!stats) continue;
			stats.totalTasks += row._count._all;
			if (row.status === 'DONE') stats.completedTasks += row._count._all;
		}
		for (const row of activityGroups) {
			const stats = projectStats.get(row.projectId ?? '');
			if (stats) stats.lastActivityAt = row._max.updatedAt;
		}

		const mentorandos = new Map<
			string,
			{
				learner: { id: string; name: string | null; email: string };
				projects: Array<{
					id: string;
					title: string;
					totalTasks: number;
					completedTasks: number;
					progress: number;
					lastActivityAt: Date | null;
				}>;
				nextSession: (typeof bookings)[number] | null;
				pendingItems: PendingItem[];
			}
		>();
		for (const project of visibleProjects) {
			const stats = projectStats.get(project.id);
			if (!stats) continue;
			for (const membership of project.memberships.slice(
				0,
				MAX_LEARNERS_PER_PROJECT
			)) {
				const current = mentorandos.get(membership.userId);
				const projectSummary = {
					id: project.id,
					title: project.title,
					totalTasks: stats.totalTasks,
					completedTasks: stats.completedTasks,
					progress:
						stats.totalTasks > 0
							? Math.round((stats.completedTasks / stats.totalTasks) * 100)
							: 0,
					lastActivityAt: stats.lastActivityAt
				};
				if (current) {
					current.projects.push(projectSummary);
				} else {
					mentorandos.set(membership.userId, {
						learner: membership.user,
						projects: [projectSummary],
						nextSession: null,
						pendingItems: []
					});
				}
			}
		}

		const projectPendingItems = new Map<string, PendingItem[]>();
		const addToLearner = (learnerId: string, item: PendingItem) => {
			mentorandos.get(learnerId)?.pendingItems.push(item);
		};
		const addToProject = (projectId: string, item: PendingItem) => {
			const items = projectPendingItems.get(projectId) ?? [];
			items.push(item);
			projectPendingItems.set(projectId, items);
		};

		for (const review of reviews.slice(0, MAX_PENDING_ITEMS_PER_SOURCE)) {
			const project = review.task.project;
			const projectId = review.task.projectId;
			if (!project || !projectId) continue;
			if (!learnerIdsByProject.get(projectId)?.has(review.requestedBy.id)) {
				continue;
			}
			addToLearner(review.requestedBy.id, {
				id: review.id,
				type: 'PR_REVIEW',
				title: review.task.title,
				context: 'Pull Request',
				projectId,
				projectTitle: project.title,
				occurredAt: review.createdAt,
				dueDate: null,
				href: `/workspace/${projectId}?taskId=${review.task.id}`
			});
		}

		for (const task of overdueTasks.slice(0, MAX_PENDING_ITEMS_PER_SOURCE)) {
			const project = task.project;
			if (!project || !task.projectId || !task.dueDate) continue;
			const item: PendingItem = {
				id: task.id,
				type: 'OVERDUE_TASK',
				title: task.title,
				context: task.sprint?.title ?? 'Task',
				projectId: task.projectId,
				projectTitle: project.title,
				occurredAt: task.dueDate,
				dueDate: task.dueDate,
				href: `/workspace/${task.projectId}?taskId=${task.id}`
			};
			const learnerIds = task.assignees
				.map((assignee) => assignee.id)
				.filter((assigneeId) =>
					learnerIdsByProject.get(task.projectId ?? '')?.has(assigneeId)
				);
			if (learnerIds.length === 0) {
				addToProject(task.projectId, item);
			} else {
				for (const learnerId of learnerIds) addToLearner(learnerId, item);
			}
		}

		for (const sprint of overdueSprints.slice(
			0,
			MAX_PENDING_ITEMS_PER_SOURCE
		)) {
			const project = sprint.project;
			if (!project || !sprint.projectId || !sprint.endDate) continue;
			addToProject(sprint.projectId, {
				id: sprint.id,
				type: 'OVERDUE_SPRINT',
				title: sprint.title,
				context: 'Sprint',
				projectId: sprint.projectId,
				projectTitle: project.title,
				occurredAt: sprint.endDate,
				dueDate: sprint.endDate,
				href: `/workspace/${sprint.projectId}?sprintId=${sprint.id}`
			});
		}

		const nextSessionByLearner = new Map<string, (typeof bookings)[number]>();
		for (const booking of bookings.slice(0, MAX_UPCOMING_SESSIONS)) {
			if (!nextSessionByLearner.has(booking.userId)) {
				nextSessionByLearner.set(booking.userId, booking);
			}
		}
		for (const [learnerId, group] of mentorandos) {
			group.nextSession = nextSessionByLearner.get(learnerId) ?? null;
			sortPendingItems(group.pendingItems);
		}

		return {
			projects: visibleProjects.map(({ id, title }) => ({ id, title })),
			mentorandos: [...mentorandos.values()].sort((a, b) =>
				(a.learner.name ?? a.learner.email).localeCompare(
					b.learner.name ?? b.learner.email
				)
			),
			projectPendingItems: [...projectPendingItems.entries()]
				.map(([projectId, items]) => ({
					project: visibleProjects.find(({ id }) => id === projectId),
					pendingItems: sortPendingItems(items)
				}))
				.filter((group) => group.project),
			hasMore
		};
	})
});
