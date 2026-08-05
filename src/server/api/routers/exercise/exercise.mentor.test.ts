import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { exerciseRouter } from './exercise.router';

const authState = vi.hoisted(() => ({
	userId: 'admin-1' as string | null,
	isAdmin: true
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

describe('exercise mentor review queue', () => {
	const createCaller = createCallerFactory(exerciseRouter);
	let caller: ReturnType<typeof createCaller>;

	const submissionId = '55555555-5555-5555-5555-555555555555';
	const decisionA = '66666666-6666-6666-6666-666666666666';
	const decisionB = '77777777-7777-7777-7777-777777777777';
	const challengeA = '22222222-2222-2222-2222-222222222222';
	const challengeB = '33333333-3333-3333-3333-333333333333';
	const studentId = 'user-1';

	beforeEach(async () => {
		authState.userId = 'admin-1';
		authState.isAdmin = true;
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);
	});

	it('lists submissions that need attention for admins', async () => {
		mockDb.exerciseReviewSubmission.findMany.mockResolvedValue([
			{
				id: submissionId,
				prUrl: 'https://github.com/org/repo/pull/1',
				createdAt: new Date('2026-08-04T12:00:00.000Z'),
				updatedAt: new Date('2026-08-04T12:00:00.000Z'),
				needsAttention: true,
				track: { id: 'track-1', name: 'React', slug: 'react' },
				submittedBy: {
					id: studentId,
					name: 'Ada',
					email: 'ada@example.com'
				},
				decisions: [
					{
						id: decisionA,
						status: 'PENDING',
						challenge: { id: challengeA, title: 'Counter', slug: 'counter' }
					}
				]
			}
		] as never);

		const result = await caller.adminListReviewQueue();

		expect(mockDb.exerciseReviewSubmission.findMany).toHaveBeenCalledWith({
			where: { needsAttention: true },
			orderBy: { createdAt: 'asc' },
			include: expect.any(Object)
		});
		expect(result[0]?.track.name).toBe('React');
		expect(result[0]?.submittedBy.name).toBe('Ada');
		expect(result[0]?.prUrl).toContain('/pull/1');
	});

	it('approves one challenge and updates student progress', async () => {
		mockDb.exerciseReviewDecision.findUnique.mockResolvedValue({
			id: decisionA,
			status: 'PENDING',
			challengeId: challengeA,
			submissionId,
			challenge: {
				title: 'Counter',
				slug: 'counter',
				track: { slug: 'react' }
			},
			submission: {
				id: submissionId,
				submittedById: studentId,
				decisions: [
					{ id: decisionA, status: 'PENDING' },
					{ id: decisionB, status: 'PENDING' }
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
			id: decisionA,
			status: 'APPROVED',
			mentorComment: 'Nice work',
			challengeId: challengeA
		} as never);
		mockDb.userChallengeProgress.update.mockResolvedValue({} as never);
		mockDb.exerciseReviewSubmission.update.mockResolvedValue({} as never);

		const result = await caller.decideChallengeReview({
			decisionId: decisionA,
			status: 'APPROVED',
			mentorComment: 'Nice work'
		});

		expect(mockDb.exerciseReviewDecision.update).toHaveBeenCalledWith({
			where: { id: decisionA },
			data: expect.objectContaining({
				status: 'APPROVED',
				mentorComment: 'Nice work',
				reviewedById: 'admin-1'
			})
		});
		expect(mockDb.userChallengeProgress.update).toHaveBeenCalledWith({
			where: {
				userId_challengeId: {
					userId: studentId,
					challengeId: challengeA
				}
			},
			data: { status: 'APPROVED' }
		});
		expect(mockDb.exerciseReviewSubmission.update).toHaveBeenCalledWith({
			where: { id: submissionId },
			data: { needsAttention: true }
		});
		expect(result.status).toBe('APPROVED');
	});

	it('clears needsAttention when no pending decisions remain', async () => {
		mockDb.exerciseReviewDecision.findUnique.mockResolvedValue({
			id: decisionB,
			status: 'PENDING',
			challengeId: challengeB,
			submissionId,
			challenge: {
				title: 'Todo',
				slug: 'todo',
				track: { slug: 'react' }
			},
			submission: {
				id: submissionId,
				submittedById: studentId,
				decisions: [
					{ id: decisionA, status: 'APPROVED' },
					{ id: decisionB, status: 'PENDING' }
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
			id: decisionB,
			status: 'CHANGES_REQUESTED',
			mentorComment: null,
			challengeId: challengeB
		} as never);
		mockDb.userChallengeProgress.update.mockResolvedValue({} as never);
		mockDb.exerciseReviewSubmission.update.mockResolvedValue({} as never);

		await caller.decideChallengeReview({
			decisionId: decisionB,
			status: 'CHANGES_REQUESTED'
		});

		expect(mockDb.exerciseReviewSubmission.update).toHaveBeenCalledWith({
			where: { id: submissionId },
			data: { needsAttention: false }
		});
		expect(mockDb.userChallengeProgress.update).toHaveBeenCalledWith({
			where: {
				userId_challengeId: {
					userId: studentId,
					challengeId: challengeB
				}
			},
			data: { status: 'CHANGES_REQUESTED' }
		});
	});

	it('rejects mentor decisions for non-admins', async () => {
		authState.isAdmin = false;
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);

		await expect(
			caller.decideChallengeReview({
				decisionId: decisionA,
				status: 'APPROVED'
			})
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});
});
