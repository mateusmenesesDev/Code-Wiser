import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { processTaskDeadlineReminders } from './taskDeadlineReminders';

const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('~/server/services/notification/base', () => ({
	createNotification: createNotificationMock
}));

describe('processTaskDeadlineReminders', () => {
	beforeEach(() => {
		createNotificationMock.mockReset();
		mockDb.task.findMany.mockResolvedValue([
			{
				id: 'task-today',
				title: 'Finish form',
				dueDate: new Date('2026-08-13T00:00:00.000Z'),
				projectId: 'project-1',
				project: { title: 'Portal' },
				assignees: [{ id: 'user-1' }]
			},
			{
				id: 'task-overdue',
				title: 'Fix bug',
				dueDate: new Date('2026-08-12T00:00:00.000Z'),
				projectId: 'project-1',
				project: { title: 'Portal' },
				assignees: [{ id: 'user-1' }]
			}
		] as never);
	});

	it('sends one actionable reminder per assigned task and due date', async () => {
		const result = await processTaskDeadlineReminders(
			mockDb,
			new Date('2026-08-13T08:00:00.000Z')
		);

		expect(result).toEqual({ tasks: 2, created: 2, failures: 0 });
		expect(createNotificationMock).toHaveBeenNthCalledWith(1, {
			db: mockDb,
			userId: 'user-1',
			type: 'TASK_DUE_SOON',
			title: 'Task due today',
			message: '"Finish form" in "Portal" is due today.',
			link: '/workspace/project-1?taskId=task-today',
			dedupeKey: 'task-deadline:TASK_DUE_SOON:task-today:user-1:2026-08-13'
		});
		expect(createNotificationMock).toHaveBeenNthCalledWith(2, {
			db: mockDb,
			userId: 'user-1',
			type: 'TASK_OVERDUE',
			title: 'Task overdue',
			message: '"Fix bug" in "Portal" is overdue.',
			link: '/workspace/project-1?taskId=task-overdue',
			dedupeKey: 'task-deadline:TASK_OVERDUE:task-overdue:user-1:2026-08-12'
		});
	});
});
