import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { appRouter } from '~/server/api/root';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';

const getUserMock = vi.fn();

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
			getUser: (...args: unknown[]) => getUserMock(...args)
		}
	}
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

describe('user.listAll avatars', () => {
	const createCaller = createCallerFactory(appRouter);

	beforeEach(() => {
		getUserMock.mockReset();
	});

	it('returns projected imageUrl without per-row Clerk getUser calls', async () => {
		mockDb.user.findMany.mockResolvedValue([
			{
				id: 'user-1',
				email: 'a@example.com',
				name: 'A',
				imageUrl: 'https://img.example/a.png',
				credits: 0,
				mentorshipStatus: 'INACTIVE',
				mentorshipType: 'MONTHLY',
				mentorshipStartDate: null,
				mentorshipEndDate: null,
				weeklyMentorshipSessions: 1,
				remainingWeeklySessions: 1,
				weeklySessionsResetAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				stripeCustomerId: null,
				stripeSubscriptionId: null
			}
		] as never);
		mockDb.user.count.mockResolvedValue(1);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		const result = await caller.user.listAll({ take: 50, skip: 0 });

		expect(result.users[0]?.imageUrl).toBe('https://img.example/a.png');
		expect(getUserMock).not.toHaveBeenCalled();
	});
});
