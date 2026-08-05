import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { exerciseRouter } from './exercise.router';

const authState = vi.hoisted(() => ({
	userId: 'user-1' as string | null,
	isAdmin: false
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: authState.isAdmin ? { o: { rol: 'admin' } } : null,
		sessionId: authState.userId ? 'test-session-id' : null,
		getToken: () => Promise.resolve(authState.userId ? 'test-token' : null),
		has: ({ role }: { role: string }) =>
			authState.isAdmin && role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('exercise progress', () => {
	const createCaller = createCallerFactory(exerciseRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		authState.userId = 'user-1';
		authState.isAdmin = false;
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);
	});

	it('starts a challenge by creating IN_PROGRESS progress for the authenticated user', async () => {
		mockDb.exerciseChallenge.findFirst.mockResolvedValue({
			id: '22222222-2222-2222-2222-222222222222',
			isArchived: false,
			track: { isPublished: true, isArchived: false }
		} as never);
		mockDb.userChallengeProgress.findUnique.mockResolvedValue(null);
		mockDb.userChallengeProgress.create.mockResolvedValue({
			id: '33333333-3333-3333-3333-333333333333',
			userId: 'user-1',
			challengeId: '22222222-2222-2222-2222-222222222222',
			status: 'IN_PROGRESS',
			startedAt: new Date('2026-08-04T12:00:00.000Z'),
			createdAt: new Date(),
			updatedAt: new Date()
		} as never);

		const result = await caller.startChallenge({
			id: '22222222-2222-2222-2222-222222222222'
		});

		expect(mockDb.userChallengeProgress.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'user-1',
				challengeId: '22222222-2222-2222-2222-222222222222',
				status: 'IN_PROGRESS'
			})
		});
		expect(result.status).toBe('IN_PROGRESS');
	});

	it('rejects startChallenge for unauthenticated users', async () => {
		authState.userId = null;
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);

		await expect(
			caller.startChallenge({
				id: '22222222-2222-2222-2222-222222222222'
			})
		).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
	});

	it('includes viewer progress status on published track challenges when logged in', async () => {
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: '11111111-1111-1111-1111-111111111111',
			name: 'React',
			slug: 'react',
			description: 'React track',
			repoUrl: 'https://github.com/org/react',
			sortOrder: 0,
			isPublished: true,
			isArchived: false,
			challenges: [
				{
					id: '22222222-2222-2222-2222-222222222222',
					title: 'Counter',
					slug: 'counter',
					difficulty: 'EASY',
					sortOrder: 0,
					isArchived: false
				},
				{
					id: '44444444-4444-4444-4444-444444444444',
					title: 'Todo',
					slug: 'todo',
					difficulty: 'MEDIUM',
					sortOrder: 0,
					isArchived: false
				}
			]
		} as never);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([
			{
				challengeId: '22222222-2222-2222-2222-222222222222',
				status: 'APPROVED'
			}
		] as never);

		const result = await caller.getPublishedTrackBySlug({ slug: 'react' });

		expect(mockDb.userChallengeProgress.findMany).toHaveBeenCalledWith({
			where: {
				userId: 'user-1',
				challengeId: {
					in: [
						'22222222-2222-2222-2222-222222222222',
						'44444444-4444-4444-4444-444444444444'
					]
				}
			},
			select: { challengeId: true, status: true }
		});
		expect(result.challenges[0]?.status).toBe('APPROVED');
		expect(result.challenges[1]?.status).toBe('NOT_STARTED');
	});

	it('includes viewer progress status on challenge detail when logged in', async () => {
		mockDb.exerciseChallenge.findFirst.mockResolvedValue({
			id: '22222222-2222-2222-2222-222222222222',
			title: 'Counter',
			slug: 'counter',
			difficulty: 'EASY',
			sortOrder: 0,
			isArchived: false,
			description: 'Build a counter',
			setupInstructions: 'npm i',
			acceptanceCriteria: 'Tests pass',
			track: {
				id: '11111111-1111-1111-1111-111111111111',
				name: 'React',
				slug: 'react',
				repoUrl: 'https://github.com/org/react',
				isPublished: true,
				isArchived: false
			}
		} as never);
		mockDb.userChallengeProgress.findUnique.mockResolvedValue({
			status: 'IN_PROGRESS'
		} as never);

		const result = await caller.getPublishedChallengeBySlug({
			trackSlug: 'react',
			challengeSlug: 'counter'
		});

		expect(result.status).toBe('IN_PROGRESS');
	});
});
