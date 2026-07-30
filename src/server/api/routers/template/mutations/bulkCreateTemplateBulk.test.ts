import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectTemplateRouter } from '../projectTemplate';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'admin-user-id',
		sessionClaims: { o: { rol: 'admin' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: ({ role }: { role: string }) => role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('projectTemplate.bulkCreateTasksSprintsEpics', () => {
	const createCaller = createCallerFactory(projectTemplateRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('creates epics, sprints, and tasks with createMany', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.epic.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.sprint.count.mockResolvedValue(0);
		mockDb.sprint.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.projectTemplate.update.mockResolvedValue({
			nextTaskNumber: 2
		} as never);
		mockDb.task.createMany.mockResolvedValue({ count: 1 } as never);

		const result = await caller.bulkCreateTasksSprintsEpics({
			projectTemplateId: 'template-id',
			data: {
				epics: [{ title: 'Epic A', description: 'E' }],
				sprints: [{ title: 'Sprint A', description: 'S' }],
				tasks: [
					{
						title: 'Task A',
						epicTitle: 'Epic A',
						sprintTitle: 'Sprint A'
					}
				]
			}
		});

		expect(result).toEqual({
			epicsCreated: 1,
			sprintsCreated: 1,
			tasksCreated: 1,
			warnings: undefined
		});
		expect(mockDb.epic.create).not.toHaveBeenCalled();
		expect(mockDb.sprint.create).not.toHaveBeenCalled();
		expect(mockDb.task.create).not.toHaveBeenCalled();
		expect(mockDb.epic.createMany).toHaveBeenCalledTimes(1);
		expect(mockDb.sprint.createMany).toHaveBeenCalledTimes(1);
		expect(mockDb.task.createMany).toHaveBeenCalledTimes(1);
	});
});
