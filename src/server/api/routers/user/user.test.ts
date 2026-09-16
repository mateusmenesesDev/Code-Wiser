import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { userRouter } from './user';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'admin-user-id',
		sessionClaims: { o: { rol: 'admin' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: ({ role }: { role: string }) => role === 'org:admin'
	}),
	clerkClient: {
		users: {
			getUser: vi.fn()
		}
	}
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/env', () => ({
	env: { CLERK_SECRET_KEY: 'test-secret' }
}));

vi.mock('~/server/services/mentorship/mentorshipService', () => ({
	adminResetUserSessions: vi.fn()
}));

describe('user credit operations', () => {
	const createCaller = createCallerFactory(userRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.creditTransaction.createMany.mockResolvedValue({ count: 1 });
		mockDb.creditTransaction.findUnique.mockResolvedValue({
			id: 'transaction-1'
		} as never);
		mockDb.user.updateMany.mockResolvedValue({ count: 1 });
		mockDb.user.update.mockResolvedValue({} as never);
	});

	it('records an admin credit adjustment through the ledger', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.adjustCredits({
				userId: 'user-1',
				delta: 25,
				reason: 'Compensation for a failed session',
				idempotencyKey: '11111111-1111-4111-8111-111111111111'
			})
		).resolves.toMatchObject({ applied: true });

		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'user-1',
				value: 25,
				type: 'ADJUSTMENT',
				source: 'ADMIN',
				actorUserId: 'admin-user-id'
			}),
			skipDuplicates: true
		});
	});

	it('does not accept credits through the generic user update', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.update({ id: 'user-1', credits: 100 } as never);

		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {}
		});
		expect(mockDb.creditTransaction.createMany).not.toHaveBeenCalled();
	});
});

describe('user impersonation', () => {
	const createCaller = createCallerFactory(userRouter);

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('requires an admin session', async () => {
		const context = await createTRPCContext({ headers: new Headers() });
		const caller = createCaller({ ...context, isAdmin: false });

		await expect(
			caller.impersonate({ userId: 'target-user-id' })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('rejects an unknown target user', async () => {
		mockDb.user.findUnique.mockResolvedValueOnce(null);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.impersonate({ userId: 'missing-user-id' })
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});

	it('creates an actor token for a known target user', async () => {
		mockDb.user.findUnique.mockResolvedValueOnce({
			id: 'target-user-id'
		} as never);
		vi.mocked(fetch)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ token: 'actor-token' }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ token: 'admin-token' }), { status: 200 })
			);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.impersonate({ userId: 'target-user-id' })
		).resolves.toEqual({ token: 'actor-token', restoreToken: 'admin-token' });
		expect(fetch).toHaveBeenNthCalledWith(
			1,
			'https://api.clerk.com/v1/actor_tokens',
			expect.objectContaining({
				method: 'POST',
				headers: {
					Authorization: 'Bearer test-secret',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user_id: 'target-user-id',
					actor: { sub: 'admin-user-id' }
				})
			})
		);
		expect(fetch).toHaveBeenNthCalledWith(
			2,
			'https://api.clerk.com/v1/sign_in_tokens',
			expect.objectContaining({
				body: JSON.stringify({
					user_id: 'admin-user-id',
					expires_in_seconds: 300
				})
			})
		);
	});
});
