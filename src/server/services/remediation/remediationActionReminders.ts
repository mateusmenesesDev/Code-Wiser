import { Prisma, type PrismaClient } from '@prisma/client';
import { getAgendaDateRange } from '~/features/agenda/utils/dateRange';
import { createNotification } from '~/server/services/notification/base';

const MAX_ACTIONS_PER_RUN = 500;

function calendarDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

function actionLink(action: {
	targetType: string;
	task: { id: string; projectId: string | null } | null;
	challenge: { slug: string; track: { slug: string } } | null;
	booking: { id: string } | null;
}) {
	if (action.targetType === 'TASK' && action.task?.projectId) {
		return `/workspace/${action.task.projectId}?taskId=${action.task.id}`;
	}
	if (action.targetType === 'EXERCISE' && action.challenge) {
		return `/exercises/${action.challenge.track.slug}/${action.challenge.slug}`;
	}
	if (action.targetType === 'MENTORSHIP' && action.booking) {
		return `/mentorship?bookingId=${action.booking.id}`;
	}
	return '/';
}

export async function processRemediationActionReminders(
	db: PrismaClient,
	now = new Date()
) {
	const today = calendarDate(now);
	const { from: todayStart, to: tomorrowStart } = getAgendaDateRange(
		'today',
		today
	);

	if (!todayStart || !tomorrowStart) {
		throw new Error('Remediation action reminder range is incomplete');
	}

	const actions = await db.remediationAction.findMany({
		where: {
			status: { in: ['OPEN', 'IN_PROGRESS'] },
			dueAt: { not: null, lt: tomorrowStart },
			learner: { taskDeadlineRemindersEnabled: true }
		},
		orderBy: { dueAt: 'asc' },
		take: MAX_ACTIONS_PER_RUN,
		select: {
			id: true,
			learnerId: true,
			title: true,
			dueAt: true,
			targetType: true,
			task: { select: { id: true, projectId: true } },
			challenge: {
				select: { slug: true, track: { select: { slug: true } } }
			},
			booking: { select: { id: true } }
		}
	});

	let created = 0;
	let failures = 0;

	for (const action of actions) {
		if (!action.dueAt) continue;

		const overdue = action.dueAt < todayStart;
		const type = overdue
			? 'REMEDIATION_ACTION_OVERDUE'
			: 'REMEDIATION_ACTION_DUE';
		const dueDate = calendarDate(action.dueAt);
		const title = overdue
			? 'Feedback action overdue'
			: 'Feedback action due today';
		const message = overdue
			? `"${action.title}" is overdue. Review the feedback and submit your evidence.`
			: `"${action.title}" is due today. Review the feedback and submit your evidence.`;

		try {
			await createNotification({
				db,
				userId: action.learnerId,
				type,
				title,
				message,
				link: actionLink(action),
				dedupeKey: `remediation-action-deadline:${type}:${action.id}:${action.learnerId}:${dueDate}`
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
			console.error('Failed to create remediation action reminder:', error);
		}
	}

	return { actions: actions.length, created, failures };
}
