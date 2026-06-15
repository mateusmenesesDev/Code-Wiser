import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { planningPokerRouter } from '../planningPokerRouter';

const realtime = vi.hoisted(() => ({
	trigger: vi.fn()
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { o: { rol: 'member' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => realtime
}));

describe('planningPoker.vote realtime', () => {
	const createCaller = createCallerFactory(planningPokerRouter);

	beforeEach(() => {
		realtime.trigger.mockResolvedValue(undefined);
	});

	it('broadcasts vote changes on the presence channel used by room members', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1'],
			currentTaskIndex: 0
		} as never);
		mockDb.project.findUnique
			.mockResolvedValueOnce({ members: [{ id: 'user-1' }] } as never)
			.mockResolvedValueOnce({ canceledAt: null } as never);
		mockDb.planningPokerVote.upsert.mockResolvedValue({
			id: 'vote-1',
			sessionId: 'session-1',
			taskId: 'task-1',
			userId: 'user-1',
			storyPoints: 5,
			user: {
				id: 'user-1',
				name: 'Ada',
				email: 'ada@example.com'
			}
		} as never);

		await caller.vote({ sessionId: 'session-1', storyPoints: 5 });

		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-planning-poker-session-1',
			'vote',
			{
				sessionId: 'session-1',
				taskId: 'task-1',
				userId: 'user-1',
				storyPoints: 5
			}
		);
	});
});
