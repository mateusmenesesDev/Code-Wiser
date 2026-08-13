import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectRouter } from '../project';

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

describe('project.getActiveProjects', () => {
	const createCaller = createCallerFactory(projectRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		caller = createCaller(await createTRPCContext({ headers: new Headers() }));
	});

	it('returns progress aggregates without embedding task arrays', async () => {
		mockDb.project.findMany.mockResolvedValue([
			{
				id: 'p1',
				title: 'Alpha',
				category: { name: 'Fullstack' },
				memberships: [
					{
						role: 'LEARNER',
						user: { id: 'u1', name: 'Ada', email: 'ada@example.com' }
					}
				]
			}
		] as never);

		vi.mocked(mockDb.task.groupBy).mockResolvedValue([
			{ projectId: 'p1', status: 'DONE', _count: { _all: 1 } },
			{ projectId: 'p1', status: 'IN_PROGRESS', _count: { _all: 3 } }
		] as never);

		const result = await caller.getActiveProjects({ limit: 12 });

		expect(result.projects[0]).toEqual(
			expect.objectContaining({
				id: 'p1',
				totalTasks: 4,
				completedTasks: 1,
				progress: 25
			})
		);
		expect(result.projects[0]).not.toHaveProperty('tasks');

		const findManyArgs = mockDb.project.findMany.mock.calls[0]?.[0] as {
			include: Record<string, unknown>;
		};
		expect(findManyArgs.include.tasks).toBeUndefined();
		expect(findManyArgs.include.memberships).toBeTruthy();
		expect(findManyArgs.include.category).toBe(true);
	});

	it('applies server-side search on title or members', async () => {
		mockDb.project.findMany.mockResolvedValue([] as never);

		await caller.getActiveProjects({
			limit: 12,
			search: 'ada'
		});

		expect(mockDb.project.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					OR: expect.arrayContaining([
						expect.objectContaining({
							title: expect.objectContaining({ contains: 'ada' })
						}),
						expect.objectContaining({
							memberships: expect.objectContaining({
								some: expect.any(Object)
							})
						})
					])
				})
			})
		);
	});
});
