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

vi.mock('~/server/services/notification/exerciseNotifications', () => ({
	notifyExerciseReviewRequested: vi.fn().mockResolvedValue(undefined),
	notifyExercisePrUpdated: vi.fn().mockResolvedValue(undefined),
	notifyExerciseChallengeResponse: vi.fn().mockResolvedValue(undefined)
}));

describe('exercise lifecycle edge cases', () => {
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

	it('lets a mentee view an archived track when they have progress', async () => {
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: '11111111-1111-1111-1111-111111111111',
			name: 'React',
			slug: 'react',
			description: 'React track',
			repoUrl: 'https://github.com/org/react',
			sortOrder: 0,
			isPublished: true,
			isArchived: true,
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
					title: 'Archived todo',
					slug: 'archived-todo',
					difficulty: 'MEDIUM',
					sortOrder: 0,
					isArchived: true
				}
			]
		} as never);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([
			{
				challengeId: '22222222-2222-2222-2222-222222222222',
				status: 'IN_REVIEW'
			}
		] as never);

		const result = await caller.getPublishedTrackBySlug({ slug: 'react' });

		expect(result.isArchived).toBe(true);
		expect(result.challenges.map((c) => c.slug)).toEqual(['counter']);
	});

	it('lets a mentee view an archived challenge when they have progress', async () => {
		mockDb.exerciseChallenge.findFirst.mockResolvedValue({
			id: '22222222-2222-2222-2222-222222222222',
			title: 'Counter',
			slug: 'counter',
			difficulty: 'EASY',
			sortOrder: 0,
			isArchived: true,
			description: 'Build a counter',
			setupInstructions: 'npm i',
			acceptanceCriteria: 'Tests pass',
			track: {
				id: '11111111-1111-1111-1111-111111111111',
				name: 'React',
				slug: 'react',
				repoUrl: 'https://github.com/org/react',
				isPublished: true,
				isArchived: true
			}
		} as never);
		mockDb.userChallengeProgress.findUnique.mockResolvedValue({
			status: 'IN_REVIEW'
		} as never);
		mockDb.exerciseReviewDecision.findFirst.mockResolvedValue(null);

		const result = await caller.getPublishedChallengeBySlug({
			trackSlug: 'react',
			challengeSlug: 'counter'
		});

		expect(result.status).toBe('IN_REVIEW');
		expect(result.title).toBe('Counter');
		expect(result.isArchived).toBe(true);
	});

	it('hides archived challenges from anonymous visitors', async () => {
		authState.userId = null;
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);

		mockDb.exerciseChallenge.findFirst.mockResolvedValue({
			id: '22222222-2222-2222-2222-222222222222',
			title: 'Counter',
			slug: 'counter',
			difficulty: 'EASY',
			sortOrder: 0,
			isArchived: true,
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

		await expect(
			caller.getPublishedChallengeBySlug({
				trackSlug: 'react',
				challengeSlug: 'counter'
			})
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});

	it('lets admins finish reviews for archived challenges', async () => {
		authState.isAdmin = true;
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);

		mockDb.exerciseReviewDecision.findUnique.mockResolvedValue({
			id: '66666666-6666-6666-6666-666666666666',
			status: 'PENDING',
			challengeId: '22222222-2222-2222-2222-222222222222',
			submissionId: '55555555-5555-5555-5555-555555555555',
			challenge: {
				title: 'Counter',
				slug: 'counter',
				isArchived: true,
				track: { slug: 'react', isArchived: true }
			},
			submission: {
				id: '55555555-5555-5555-5555-555555555555',
				submittedById: 'user-1',
				decisions: [
					{ id: '66666666-6666-6666-6666-666666666666', status: 'PENDING' }
				]
			}
		} as never);
		mockDb.user.findUnique.mockResolvedValue({ name: 'Mentor' } as never);
		mockDb.$transaction.mockImplementation(async (fn: unknown) => {
			if (typeof fn === 'function') {
				return fn(mockDb);
			}
			return fn;
		});
		mockDb.exerciseReviewDecision.update.mockResolvedValue({
			id: '66666666-6666-6666-6666-666666666666',
			status: 'APPROVED'
		} as never);
		mockDb.userChallengeProgress.update.mockResolvedValue({} as never);
		mockDb.exerciseReviewSubmission.update.mockResolvedValue({} as never);

		const result = await caller.decideChallengeReview({
			decisionId: '66666666-6666-6666-6666-666666666666',
			status: 'APPROVED'
		});

		expect(result.status).toBe('APPROVED');
		expect(mockDb.userChallengeProgress.update).toHaveBeenCalled();
	});

	it('keeps mentorship-gated mutations blocked when mentorship lapses', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'INACTIVE'
		} as never);

		await expect(
			caller.requestReview({
				trackId: '11111111-1111-1111-1111-111111111111',
				prUrl: 'https://github.com/org/repo/pull/1',
				challengeIds: ['22222222-2222-2222-2222-222222222222']
			})
		).rejects.toMatchObject({
			code: 'FORBIDDEN',
			message: 'You do not have an active mentorship'
		});

		await expect(
			caller.notifyPrUpdated({
				submissionId: '55555555-5555-5555-5555-555555555555'
			})
		).rejects.toMatchObject({
			code: 'FORBIDDEN',
			message: 'You do not have an active mentorship'
		});
	});
});
