import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectRouter } from '../project';

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

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('project.getEnrolled', () => {
	const createCaller = createCallerFactory(projectRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
	});

	it('returns progress and last activity without per-project fan-out queries', async () => {
		mockDb.project.findMany.mockResolvedValue([
			{
				id: 'p1',
				title: 'Project One',
				category: { name: 'Fullstack' }
			},
			{
				id: 'p2',
				title: 'Project Two',
				category: { name: 'Backend' }
			}
		] as never);

		vi.mocked(mockDb.task.groupBy).mockImplementation((args) => {
			const by = (args as { by: string[] }).by;
			if (by.includes('status')) {
				return Promise.resolve([
					{ projectId: 'p1', status: 'DONE', _count: { _all: 1 } },
					{ projectId: 'p1', status: 'IN_PROGRESS', _count: { _all: 1 } },
					{ projectId: 'p2', status: 'DONE', _count: { _all: 3 } }
				]) as never;
			}
			return Promise.resolve([
				{
					projectId: 'p1',
					_max: { updatedAt: new Date('2026-07-01T00:00:00.000Z') }
				},
				{
					projectId: 'p2',
					_max: { updatedAt: new Date('2026-07-03T00:00:00.000Z') }
				}
			]) as never;
		});

		const result = await caller.getEnrolled();

		expect(result).toEqual([
			expect.objectContaining({
				id: 'p1',
				totalTasks: 2,
				completedTasks: 1,
				progress: 50,
				lastActivityAt: '2026-07-01T00:00:00.000Z'
			}),
			expect.objectContaining({
				id: 'p2',
				totalTasks: 3,
				completedTasks: 3,
				progress: 100,
				lastActivityAt: '2026-07-03T00:00:00.000Z'
			})
		]);

		expect(mockDb.task.groupBy).toHaveBeenCalledTimes(2);
		expect(mockDb.task.findMany).not.toHaveBeenCalled();
		expect(mockDb.task.findFirst).not.toHaveBeenCalled();
	});
});
