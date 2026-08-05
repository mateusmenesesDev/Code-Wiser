import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { exerciseRouter } from './exercise.router';

const authState = vi.hoisted(() => ({
	userId: 'user-1' as string | null
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: null,
		sessionId: authState.userId ? 'test-session-id' : null,
		getToken: () => Promise.resolve(authState.userId ? 'test-token' : null),
		has: () => false
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

describe('exercise notifyPrUpdated', () => {
	const createCaller = createCallerFactory(exerciseRouter);
	let caller: ReturnType<typeof createCaller>;

	const submissionId = '55555555-5555-5555-5555-555555555555';
	const decisionApproved = '66666666-6666-6666-6666-666666666666';
	const decisionChanges = '77777777-7777-7777-7777-777777777777';
	const challengeApproved = '22222222-2222-2222-2222-222222222222';
	const challengeChanges = '33333333-3333-3333-3333-333333333333';

	beforeEach(async () => {
		authState.userId = 'user-1';
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);
	});

	it('reopens only CHANGES_REQUESTED challenges and preserves approvals', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseReviewSubmission.findFirst.mockResolvedValue({
			id: submissionId,
			submittedById: 'user-1',
			track: { name: 'React' },
			submittedBy: { name: 'Ada' },
			decisions: [
				{
					id: decisionApproved,
					status: 'APPROVED',
					challengeId: challengeApproved,
					challenge: { title: 'Counter' }
				},
				{
					id: decisionChanges,
					status: 'CHANGES_REQUESTED',
					challengeId: challengeChanges,
					challenge: { title: 'Todo' }
				}
			]
		} as never);
		mockDb.$transaction.mockImplementation(async (fn: unknown) => {
			if (typeof fn === 'function') {
				return fn(mockDb);
			}
			return fn;
		});
		mockDb.exerciseReviewDecision.update.mockResolvedValue({} as never);
		mockDb.userChallengeProgress.update.mockResolvedValue({} as never);
		mockDb.exerciseReviewSubmission.update.mockResolvedValue({
			id: submissionId,
			needsAttention: true,
			updateNote: 'Fixed tests'
		} as never);

		const result = await caller.notifyPrUpdated({
			submissionId,
			updateNote: 'Fixed tests'
		});

		expect(mockDb.exerciseReviewDecision.update).toHaveBeenCalledTimes(1);
		expect(mockDb.exerciseReviewDecision.update).toHaveBeenCalledWith({
			where: { id: decisionChanges },
			data: {
				status: 'PENDING',
				reviewedAt: null,
				reviewedById: null
			}
		});
		expect(mockDb.userChallengeProgress.update).toHaveBeenCalledWith({
			where: {
				userId_challengeId: {
					userId: 'user-1',
					challengeId: challengeChanges
				}
			},
			data: { status: 'IN_REVIEW' }
		});
		expect(mockDb.exerciseReviewSubmission.update).toHaveBeenCalledWith({
			where: { id: submissionId },
			data: {
				needsAttention: true,
				updateNote: 'Fixed tests'
			}
		});
		expect(result.needsAttention).toBe(true);
	});

	it('rejects notifyPrUpdated without active mentorship', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'INACTIVE'
		} as never);

		await expect(
			caller.notifyPrUpdated({ submissionId })
		).rejects.toMatchObject({
			code: 'FORBIDDEN',
			message: 'You do not have an active mentorship'
		});
	});

	it('rejects when submission has no CHANGES_REQUESTED challenges', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseReviewSubmission.findFirst.mockResolvedValue({
			id: submissionId,
			submittedById: 'user-1',
			track: { name: 'React' },
			submittedBy: { name: 'Ada' },
			decisions: [
				{
					id: decisionApproved,
					status: 'APPROVED',
					challengeId: challengeApproved,
					challenge: { title: 'Counter' }
				}
			]
		} as never);

		await expect(
			caller.notifyPrUpdated({ submissionId })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		});
	});
});
