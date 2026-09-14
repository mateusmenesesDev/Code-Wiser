import { describe, expect, it, vi } from 'vitest';
import { createCallerFactory } from '~/server/api/trpc';
import { notificationRouter } from './notificationRouter';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: null,
		sessionId: 'session-1',
		getToken: () => Promise.resolve('token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({ db: {} }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('notification mutations', () => {
	const createCaller = createCallerFactory(notificationRouter);

	it('clears every notification belonging to the authenticated user', async () => {
		const deleteMany = vi.fn().mockResolvedValue({ count: 3 });
		const caller = createCaller({
			db: { notification: { deleteMany } } as never,
			realtime: {} as never,
			session: { userId: 'user-1' } as never,
			isAdmin: false,
			headers: new Headers()
		});

		const result = await caller.clearAll();

		expect(result).toEqual({ success: true });
		expect(deleteMany).toHaveBeenCalledWith({
			where: { userId: 'user-1' }
		});
	});
});
