import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { processRemediationActionReminders } from './remediationActionReminders';

const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('~/server/services/notification/base', () => ({
	createNotification: createNotificationMock
}));

describe('processRemediationActionReminders', () => {
	beforeEach(() => {
		createNotificationMock.mockReset();
		mockDb.remediationAction.findMany.mockResolvedValue([
			{
				id: 'action-today',
				learnerId: 'learner-1',
				title: 'Add integration tests',
				dueAt: new Date('2026-08-13T00:00:00.000Z'),
				targetType: 'EXERCISE',
				task: null,
				challenge: {
					slug: 'integration-tests',
					track: { slug: 'typescript' }
				},
				booking: null
			},
			{
				id: 'action-overdue',
				learnerId: 'learner-1',
				title: 'Fix parser edge case',
				dueAt: new Date('2026-08-12T00:00:00.000Z'),
				targetType: 'TASK',
				task: { id: 'task-1', projectId: 'project-1' },
				challenge: null,
				booking: null
			}
		] as never);
	});

	it('sends bounded, deduplicated reminders with actionable links', async () => {
		const result = await processRemediationActionReminders(
			mockDb,
			new Date('2026-08-13T08:00:00.000Z')
		);

		expect(result).toEqual({ actions: 2, created: 2, failures: 0 });
		expect(createNotificationMock).toHaveBeenNthCalledWith(1, {
			db: mockDb,
			userId: 'learner-1',
			type: 'REMEDIATION_ACTION_DUE',
			title: 'Feedback action due today',
			message:
				'"Add integration tests" is due today. Review the feedback and submit your evidence.',
			link: '/exercises/typescript/integration-tests',
			dedupeKey:
				'remediation-action-deadline:REMEDIATION_ACTION_DUE:action-today:learner-1:2026-08-13'
		});
		expect(createNotificationMock).toHaveBeenNthCalledWith(2, {
			db: mockDb,
			userId: 'learner-1',
			type: 'REMEDIATION_ACTION_OVERDUE',
			title: 'Feedback action overdue',
			message:
				'"Fix parser edge case" is overdue. Review the feedback and submit your evidence.',
			link: '/workspace/project-1?taskId=task-1',
			dedupeKey:
				'remediation-action-deadline:REMEDIATION_ACTION_OVERDUE:action-overdue:learner-1:2026-08-12'
		});
	});
});
