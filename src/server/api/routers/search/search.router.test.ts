import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { searchRouter } from './search.router';

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

describe('search.global', () => {
	const createCaller = createCallerFactory(searchRouter);

	beforeEach(() => {
		mockDb.project.findMany.mockResolvedValue([
			{ id: 'project-1', title: 'Landing Page' }
		] as never);
		mockDb.task.findMany.mockResolvedValue([
			{
				id: 'task-1',
				title: 'Landing page hero',
				project: { id: 'project-1', title: 'Landing Page' }
			}
		] as never);
		mockDb.sprint.findMany.mockResolvedValue([
			{
				id: 'sprint-1',
				title: 'Landing page sprint',
				project: { id: 'project-1', title: 'Landing Page' }
			}
		] as never);
		mockDb.epic.findMany.mockResolvedValue([
			{
				id: 'epic-1',
				title: 'Landing page experience',
				project: { id: 'project-1', title: 'Landing Page' }
			}
		] as never);
	});

	it('returns every matching work item with its project context', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.global({ query: 'landing page' })).resolves.toEqual({
			projects: [{ id: 'project-1', title: 'Landing Page' }],
			tasks: [
				{
					id: 'task-1',
					title: 'Landing page hero',
					project: { id: 'project-1', title: 'Landing Page' }
				}
			],
			sprints: [
				{
					id: 'sprint-1',
					title: 'Landing page sprint',
					project: { id: 'project-1', title: 'Landing Page' }
				}
			],
			epics: [
				{
					id: 'epic-1',
					title: 'Landing page experience',
					project: { id: 'project-1', title: 'Landing Page' }
				}
			]
		});

		const taskWhere = mockDb.task.findMany.mock.calls[0]?.[0]?.where;
		expect(taskWhere).toEqual(
			expect.objectContaining({
				project: {
					is: {
						memberships: {
							some: { userId: 'user-1', status: 'ACTIVE' }
						}
					}
				}
			})
		);
	});

	it('requires a meaningful query', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.global({ query: 'a' })).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		});
	});
});
