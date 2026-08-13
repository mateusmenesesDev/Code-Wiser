import { Prisma, type PrismaClient } from '@prisma/client';
import { getAgendaDateRange } from '~/features/agenda/utils/dateRange';
import { createNotification } from '~/server/services/notification/base';

const MAX_TASKS_PER_RUN = 500;
const MAX_RECIPIENTS_PER_TASK = 20;

function calendarDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

export async function processTaskDeadlineReminders(
	db: PrismaClient,
	now = new Date()
) {
	const today = calendarDate(now);
	const { from: todayStart, to: tomorrowStart } = getAgendaDateRange(
		'today',
		today
	);

	if (!todayStart || !tomorrowStart) {
		throw new Error('Task deadline reminder range is incomplete');
	}

	const tasks = await db.task.findMany({
		where: {
			status: { not: 'DONE' },
			dueDate: { lt: tomorrowStart },
			project: { canceledAt: null },
			assignees: {
				some: { taskDeadlineRemindersEnabled: true }
			}
		},
		orderBy: { dueDate: 'asc' },
		take: MAX_TASKS_PER_RUN,
		select: {
			id: true,
			title: true,
			dueDate: true,
			projectId: true,
			project: { select: { title: true } },
			assignees: {
				where: { taskDeadlineRemindersEnabled: true },
				take: MAX_RECIPIENTS_PER_TASK,
				select: { id: true }
			}
		}
	});

	let created = 0;
	let failures = 0;

	for (const task of tasks) {
		if (!task.dueDate || !task.projectId || !task.project) continue;

		const overdue = task.dueDate < todayStart;
		const type = overdue ? 'TASK_OVERDUE' : 'TASK_DUE_SOON';
		const dueDate = calendarDate(task.dueDate);
		const link = `/workspace/${task.projectId}?taskId=${task.id}`;
		const title = overdue ? 'Task overdue' : 'Task due today';
		const message = overdue
			? `"${task.title}" in "${task.project.title}" is overdue.`
			: `"${task.title}" in "${task.project.title}" is due today.`;

		for (const assignee of task.assignees) {
			try {
				await createNotification({
					db,
					userId: assignee.id,
					type,
					title,
					message,
					link,
					dedupeKey: `task-deadline:${type}:${task.id}:${assignee.id}:${dueDate}`
				});
				created += 1;
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					continue;
				}
				failures += 1;
				console.error('Failed to create task deadline reminder:', error);
			}
		}
	}

	return { tasks: tasks.length, created, failures };
}
