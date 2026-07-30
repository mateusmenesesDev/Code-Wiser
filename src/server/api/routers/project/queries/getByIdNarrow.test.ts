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

describe('project.getById', () => {
	const createCaller = createCallerFactory(projectRouter);

	beforeEach(async () => {
		mockDb.project.findUnique.mockResolvedValue({
			id: 'p1',
			title: 'Project',
			category: { name: 'Fullstack' },
			epics: [],
			sprints: [],
			members: [{ id: 'user-1' }]
		} as never);
	});

	it('does not embed the full task graph', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.getById({ id: 'p1' });

		const args = mockDb.project.findUnique.mock.calls[0]?.[0] as {
			include: Record<string, unknown>;
		};
		expect(args.include.tasks).toBeUndefined();
		expect(args.include.epics).toBe(true);
		expect(args.include.sprints).toBe(true);
		expect(args.include.members).toBeTruthy();
	});
});
