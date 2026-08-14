import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { taskRouter } from '../taskRouter';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';

vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

describe('task.updateTaskOrders batching', () => {
	const createCaller = createCallerFactory(taskRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		const ctx = await createTRPCContext({
			headers: new Headers()
		});
		caller = createCaller(ctx);
	});

	it('writes changed rows in one bulk statement and skips unchanged rows', async () => {
		mockDb.task.findMany.mockResolvedValue([
			{ id: 'task-1', order: 0, status: 'TODO', projectId: 'project-1' },
			{ id: 'task-2', order: 1, status: 'TODO', projectId: 'project-1' },
			{ id: 'task-3', order: 2, status: 'TODO', projectId: 'project-1' }
		] as never);
		mockDb.project.findUnique.mockResolvedValue({
			memberships: [
				{
					userId: 'user-1',
					role: 'LEARNER',
					status: 'ACTIVE',
					joinedAt: new Date()
				}
			],
			canceledAt: null
		} as never);
		mockDb.$executeRaw.mockResolvedValue(2 as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);

		const result = await caller.updateTaskOrders({
			updates: [
				{ id: 'task-1', order: 0, status: 'TODO' },
				{ id: 'task-2', order: 0, status: 'IN_PROGRESS' },
				{ id: 'task-3', order: 1, status: 'TODO' }
			]
		});

		expect(result).toEqual({ success: true, updatedCount: 2 });
		expect(mockDb.task.update).not.toHaveBeenCalled();
		expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
		expect(mockDb.$executeRaw).toHaveBeenCalledTimes(1);
	});
});
