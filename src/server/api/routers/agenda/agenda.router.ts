import {
	getAgendaOverviewSchema,
	updateReminderPreferenceSchema
} from '~/features/agenda/schemas/agenda.schema';
import { getAgendaDateRange } from '~/features/agenda/utils/dateRange';
import { protectedProcedure } from '~/server/api/trpc';

const MAX_AGENDA_TASKS = 500;

export const agendaRouter = {
	getOverview: protectedProcedure
		.input(getAgendaOverviewSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			const dateRange = getAgendaDateRange(input.period, input.date);
			const dueDate = {
				not: null,
				...(dateRange.from ? { gte: dateRange.from } : {}),
				...(dateRange.to ? { lt: dateRange.to } : {})
			};
			const [projects, user] = await Promise.all([
				ctx.db.project.findMany({
					where: {
						canceledAt: null,
						memberships: { some: { userId, status: 'ACTIVE' } }
					},
					orderBy: { title: 'asc' },
					select: {
						id: true,
						title: true,
						sprints: {
							orderBy: { title: 'asc' },
							select: { id: true, title: true, projectId: true }
						},
						memberships: {
							where: { status: 'ACTIVE' },
							orderBy: { user: { name: 'asc' } },
							select: {
								user: { select: { id: true, name: true, email: true } }
							}
						}
					}
				}),
				ctx.db.user.findUnique({
					where: { id: userId },
					select: { taskDeadlineRemindersEnabled: true }
				})
			]);

			const projectIds = projects.map((project) => project.id);
			const taskProjectIds = input.projectId
				? projectIds.includes(input.projectId)
					? [input.projectId]
					: []
				: projectIds;
			const tasks = taskProjectIds.length
				? await ctx.db.task.findMany({
						where: {
							projectId: { in: taskProjectIds },
							status: { not: 'DONE' },
							dueDate,
							...(input.sprintId ? { sprintId: input.sprintId } : {}),
							...(input.assigneeId
								? { assignees: { some: { id: input.assigneeId } } }
								: {})
						},
						orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
						take: MAX_AGENDA_TASKS + 1,
						select: {
							id: true,
							title: true,
							dueDate: true,
							status: true,
							priority: true,
							projectId: true,
							sprintId: true,
							project: { select: { id: true, title: true } },
							sprint: { select: { id: true, title: true } },
							assignees: {
								select: { id: true, name: true, email: true }
							}
						}
					})
				: [];

			const sprintById = new Map(
				projects
					.flatMap((project) => project.sprints)
					.map((sprint) => [sprint.id, sprint])
			);
			const assigneesById = new Map(
				projects
					.flatMap((project) => project.memberships)
					.map(({ user }) => [user.id, user])
			);

			const hasMoreTasks = tasks.length > MAX_AGENDA_TASKS;

			return {
				tasks: hasMoreTasks ? tasks.slice(0, MAX_AGENDA_TASKS) : tasks,
				hasMoreTasks,
				projects: projects.map(({ id, title }) => ({ id, title })),
				sprints: [...sprintById.values()],
				assignees: [...assigneesById.values()],
				remindersEnabled: user?.taskDeadlineRemindersEnabled ?? true
			};
		}),

	updateReminderPreference: protectedProcedure
		.input(updateReminderPreferenceSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.user.update({
				where: { id: ctx.session.userId },
				data: { taskDeadlineRemindersEnabled: input.enabled }
			});

			return { enabled: input.enabled };
		})
};
