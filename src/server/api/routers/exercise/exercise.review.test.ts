import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { exerciseRouter } from './exercise.router';

const authState = vi.hoisted(() => ({
	userId: 'user-1' as string | null
}));

const githubMocks = vi.hoisted(() => ({
	isGitHubAppConfigured: vi.fn(() => false),
	getPullRequestSnapshotForRepository: vi.fn()
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

vi.mock('~/server/services/github/github', () => ({
	GitHubServiceError: class GitHubServiceError extends Error {},
	getPullRequestSnapshotForRepository:
		githubMocks.getPullRequestSnapshotForRepository,
	isGitHubAppConfigured: githubMocks.isGitHubAppConfigured
}));

vi.mock('~/server/services/notification/exerciseNotifications', () => ({
	notifyExerciseReviewRequested: vi.fn().mockResolvedValue(undefined),
	notifyExercisePrUpdated: vi.fn().mockResolvedValue(undefined),
	notifyExerciseChallengeResponse: vi.fn().mockResolvedValue(undefined)
}));

describe('exercise requestReview', () => {
	const createCaller = createCallerFactory(exerciseRouter);
	let caller: ReturnType<typeof createCaller>;

	const trackId = '11111111-1111-1111-1111-111111111111';
	const challengeA = '22222222-2222-2222-2222-222222222222';
	const challengeB = '33333333-3333-3333-3333-333333333333';
	const prUrl = 'https://github.com/org/react-exercises/pull/12';

	beforeEach(async () => {
		authState.userId = 'user-1';
		githubMocks.isGitHubAppConfigured.mockReturnValue(false);
		githubMocks.getPullRequestSnapshotForRepository.mockReset();
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);
	});

	it('creates a submission covering selected challenges and moves them to IN_REVIEW', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: trackId,
			name: 'React',
			isPublished: true,
			isArchived: false,
			repoUrl: 'https://github.com/org/react-exercises'
		} as never);
		mockDb.exerciseChallenge.findMany.mockResolvedValue([
			{ id: challengeA, trackId, title: 'Counter' },
			{ id: challengeB, trackId, title: 'Todo' }
		] as never);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([] as never);
		mockDb.$transaction.mockImplementation(async (fn: unknown) => {
			if (typeof fn === 'function') {
				return fn(mockDb);
			}
			return fn;
		});
		mockDb.exerciseReviewSubmission.create.mockResolvedValue({
			id: '55555555-5555-5555-5555-555555555555',
			prUrl,
			trackId,
			submittedById: 'user-1',
			decisions: [
				{ challengeId: challengeA, status: 'PENDING' },
				{ challengeId: challengeB, status: 'PENDING' }
			]
		} as never);
		mockDb.userChallengeProgress.upsert.mockResolvedValue({} as never);

		const result = await caller.requestReview({
			trackId,
			prUrl,
			challengeIds: [challengeA, challengeB]
		});

		expect(mockDb.exerciseReviewSubmission.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					prUrl,
					trackId,
					submittedById: 'user-1',
					needsAttention: true,
					decisions: {
						create: [
							{ challengeId: challengeA, status: 'PENDING' },
							{ challengeId: challengeB, status: 'PENDING' }
						]
					}
				})
			})
		);
		expect(mockDb.userChallengeProgress.upsert).toHaveBeenCalledTimes(2);
		expect(result.prUrl).toBe(prUrl);
	});

	it.each(['PENDING', 'FAILURE'] as const)(
		'blocks review requests when GitHub checks are %s',
		async (checksStatus) => {
			githubMocks.isGitHubAppConfigured.mockReturnValue(true);
			mockDb.user.findUnique.mockResolvedValue({
				mentorshipStatus: 'ACTIVE'
			} as never);
			mockDb.exerciseTrack.findFirst.mockResolvedValue({
				id: trackId,
				name: 'React',
				repoUrl: 'https://github.com/org/react-exercises',
				githubRepository: {
					id: 'repository-1',
					owner: 'org',
					name: 'react-exercises',
					installation: {
						githubInstallationId: 'installation-1',
						active: true
					}
				}
			} as never);
			mockDb.exerciseChallenge.findMany.mockResolvedValue([
				{ id: challengeA, trackId, title: 'Counter' }
			] as never);
			mockDb.userChallengeProgress.findMany.mockResolvedValue([] as never);
			githubMocks.getPullRequestSnapshotForRepository.mockResolvedValue({
				number: 12,
				htmlUrl: prUrl,
				title: 'Exercise',
				state: 'OPEN',
				authorLogin: 'ada',
				commitCount: 1,
				headSha: 'sha-1',
				checksStatus
			});

			await expect(
				caller.requestReview({
					trackId,
					prUrl,
					challengeIds: [challengeA]
				})
			).rejects.toMatchObject({
				code: 'PRECONDITION_FAILED',
				message:
					checksStatus === 'PENDING'
						? 'GitHub checks are still running. Wait for tests and lint to finish before requesting review.'
						: 'GitHub checks failed. Fix the failing tests or lint checks before requesting review.'
			});
			expect(mockDb.exerciseReviewSubmission.create).not.toHaveBeenCalled();
		}
	);

	it.each(['SUCCESS', 'NONE'] as const)(
		'allows a review when GitHub checks are %s and stores the status',
		async (checksStatus) => {
			githubMocks.isGitHubAppConfigured.mockReturnValue(true);
			mockDb.user.findUnique.mockResolvedValue({
				mentorshipStatus: 'ACTIVE'
			} as never);
			mockDb.exerciseTrack.findFirst.mockResolvedValue({
				id: trackId,
				name: 'React',
				repoUrl: 'https://github.com/org/react-exercises',
				githubRepository: {
					id: 'repository-1',
					owner: 'org',
					name: 'react-exercises',
					installation: {
						githubInstallationId: 'installation-1',
						active: true
					}
				}
			} as never);
			mockDb.exerciseChallenge.findMany.mockResolvedValue([
				{ id: challengeA, trackId, title: 'Counter' }
			] as never);
			mockDb.userChallengeProgress.findMany.mockResolvedValue([] as never);
			mockDb.$transaction.mockImplementation(async (fn: unknown) => {
				if (typeof fn === 'function') return fn(mockDb);
				return fn;
			});
			mockDb.exerciseReviewSubmission.create.mockResolvedValue({
				id: 'submission-1',
				prUrl,
				decisions: [{ challengeId: challengeA, status: 'PENDING' }]
			} as never);
			githubMocks.getPullRequestSnapshotForRepository.mockResolvedValue({
				number: 12,
				htmlUrl: prUrl,
				title: 'Exercise',
				state: 'OPEN',
				authorLogin: 'ada',
				commitCount: 1,
				headSha: 'sha-1',
				checksStatus
			});

			await caller.requestReview({
				trackId,
				prUrl,
				challengeIds: [challengeA]
			});

			expect(mockDb.exerciseReviewSubmission.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ githubChecksStatus: checksStatus })
				})
			);
		}
	);

	it('keeps the manual flow when a linked repository exists but the App is not configured', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: trackId,
			name: 'React',
			repoUrl: 'https://github.com/org/react-exercises',
			githubRepository: {
				id: 'repository-1',
				owner: 'org',
				name: 'react-exercises',
				installation: {
					githubInstallationId: 'installation-1',
					active: true
				}
			}
		} as never);
		mockDb.exerciseChallenge.findMany.mockResolvedValue([
			{ id: challengeA, trackId, title: 'Counter' }
		] as never);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([] as never);
		mockDb.$transaction.mockImplementation(async (fn: unknown) => {
			if (typeof fn === 'function') return fn(mockDb);
			return fn;
		});
		mockDb.exerciseReviewSubmission.create.mockResolvedValue({
			id: 'submission-1',
			prUrl,
			decisions: [{ challengeId: challengeA, status: 'PENDING' }]
		} as never);

		await caller.requestReview({
			trackId,
			prUrl,
			challengeIds: [challengeA]
		});

		expect(
			githubMocks.getPullRequestSnapshotForRepository
		).not.toHaveBeenCalled();
		expect(mockDb.exerciseReviewSubmission.create).toHaveBeenCalled();
	});

	it('rejects requestReview without active mentorship', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'INACTIVE'
		} as never);

		await expect(
			caller.requestReview({
				trackId,
				prUrl,
				challengeIds: [challengeA]
			})
		).rejects.toMatchObject({
			code: 'FORBIDDEN',
			message: 'You do not have an active mentorship'
		});
	});

	it('rejects invalid GitHub PR URLs', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);

		await expect(
			caller.requestReview({
				trackId,
				prUrl: 'https://github.com/org/react-exercises',
				challengeIds: [challengeA]
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
	});

	it('rejects PR URLs that do not belong to the track repository', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: trackId,
			name: 'React',
			repoUrl: 'https://github.com/org/react-exercises'
		} as never);

		await expect(
			caller.requestReview({
				trackId,
				prUrl: 'https://github.com/other/repo/pull/3',
				challengeIds: [challengeA]
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'PR URL must belong to this track repository'
		});
	});

	it('rejects challenges that do not belong to the track', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: trackId,
			repoUrl: ''
		} as never);
		mockDb.exerciseChallenge.findMany.mockResolvedValue([
			{ id: challengeA, trackId }
		] as never);

		await expect(
			caller.requestReview({
				trackId,
				prUrl,
				challengeIds: [challengeA, challengeB]
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'All selected challenges must belong to this published track'
		});
	});

	it('rejects challenges that already have an active review cycle with a clear message', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: trackId,
			repoUrl: 'https://github.com/org/react-exercises'
		} as never);
		mockDb.exerciseChallenge.findMany.mockResolvedValue([
			{ id: challengeA, trackId, title: 'Counter App' }
		] as never);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([
			{ challengeId: challengeA, status: 'CHANGES_REQUESTED' }
		] as never);

		await expect(
			caller.requestReview({
				trackId,
				prUrl,
				challengeIds: [challengeA]
			})
		).rejects.toMatchObject({
			code: 'CONFLICT',
			message:
				'These challenges already have an active review cycle (In review or Changes requested): Counter App'
		});
	});

	it('allows requesting review again for an already APPROVED challenge', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: trackId,
			name: 'React',
			repoUrl: 'https://github.com/org/react-exercises'
		} as never);
		mockDb.exerciseChallenge.findMany.mockResolvedValue([
			{ id: challengeA, trackId, title: 'Counter App' }
		] as never);
		// DB filters active cycles to IN_REVIEW / CHANGES_REQUESTED only,
		// so an APPROVED challenge yields no conflicting rows.
		mockDb.userChallengeProgress.findMany.mockResolvedValue([] as never);
		mockDb.$transaction.mockImplementation(async (fn: unknown) => {
			if (typeof fn === 'function') {
				return fn(mockDb);
			}
			return fn;
		});
		mockDb.exerciseReviewSubmission.create.mockResolvedValue({
			id: '55555555-5555-5555-5555-555555555555',
			prUrl,
			trackId,
			submittedById: 'user-1',
			decisions: [{ challengeId: challengeA, status: 'PENDING' }]
		} as never);
		mockDb.userChallengeProgress.upsert.mockResolvedValue({
			challengeId: challengeA,
			status: 'IN_REVIEW'
		} as never);

		const result = await caller.requestReview({
			trackId,
			prUrl,
			challengeIds: [challengeA]
		});

		expect(mockDb.userChallengeProgress.findMany).toHaveBeenCalledWith({
			where: {
				userId: 'user-1',
				challengeId: { in: [challengeA] },
				status: { in: ['IN_REVIEW', 'CHANGES_REQUESTED'] }
			},
			select: { challengeId: true, status: true }
		});
		expect(mockDb.userChallengeProgress.upsert).toHaveBeenCalledWith({
			where: {
				userId_challengeId: {
					userId: 'user-1',
					challengeId: challengeA
				}
			},
			create: expect.objectContaining({
				status: 'IN_REVIEW'
			}),
			update: { status: 'IN_REVIEW' }
		});
		expect(result.decisions[0]?.challengeId).toBe(challengeA);
	});
});
