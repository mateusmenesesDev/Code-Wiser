import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { prReviewRouter } from '../prReviewRouter';

const { notifyPRRequested, notifyPRResponse } = vi.hoisted(() => ({
	notifyPRRequested: vi.fn(),
	notifyPRResponse: vi.fn()
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
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

vi.mock('~/server/services/notification/notificationService', () => ({
	notifyPRRequested,
	notifyPRResponse
}));

describe('PR review lifecycle', () => {
	const createCaller = createCallerFactory(prReviewRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.task.findUnique.mockResolvedValue({
			id: 'task-1',
			title: 'Build feature',
			project: { id: 'project-1', title: 'Project' }
		} as never);
		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'user-1' }],
			canceledAt: null
		} as never);
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			name: 'Student',
			email: 'student@example.com',
			mentorshipStatus: 'INACTIVE'
		} as never);
		mockDb.pullRequestReview.findUnique.mockResolvedValue(null);
		mockDb.pullRequestReview.findFirst.mockResolvedValue(null);
		mockDb.pullRequestReview.create.mockResolvedValue({
			id: 'review-1'
		} as never);
		mockDb.pullRequestReview.update.mockResolvedValue({} as never);
		mockDb.pullRequestReview.updateMany.mockResolvedValue({ count: 1 });
		mockDb.creditTransaction.createMany.mockResolvedValue({ count: 1 });
		mockDb.creditTransaction.findUnique.mockResolvedValue({
			id: 'credit-transaction-1'
		} as never);
		mockDb.user.updateMany.mockResolvedValue({ count: 1 });
		vi.clearAllMocks();
		notifyPRRequested.mockResolvedValue(undefined);
		notifyPRResponse.mockResolvedValue(undefined);
	});

	it('stores the requester separately and charges once for a new review', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.requestCodeReview({
			taskId: 'task-1',
			prUrl: 'https://github.com/acme/app/pull/1',
			idempotencyKey: '11111111-1111-4111-8111-111111111111'
		});

		expect(mockDb.pullRequestReview.create).toHaveBeenCalledWith({
			data: {
				taskId: 'task-1',
				prUrl: 'https://github.com/acme/app/pull/1',
				requestIdempotencyKey: '11111111-1111-4111-8111-111111111111',
				status: 'PENDING',
				requestedById: 'user-1',
				isActive: true
			}
		});
		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: 'user-1',
					value: -5,
					idempotencyKey: 'pr-review:11111111-1111-4111-8111-111111111111'
				}),
				skipDuplicates: true
			})
		);
	});

	it('records the admin decision and timestamp on the active review', async () => {
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			id: 'review-1',
			status: 'PENDING',
			requestedById: 'user-1',
			requestedBy: {
				id: 'user-1',
				name: 'Student',
				email: 'student@example.com'
			},
			task: {
				id: 'task-1',
				title: 'Build feature',
				project: { id: 'project-1', title: 'Project' }
			}
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.approve({ taskId: 'task-1' });

		expect(mockDb.pullRequestReview.updateMany).toHaveBeenCalledWith({
			where: { id: 'review-1', status: 'PENDING' },
			data: {
				status: 'APPROVED',
				reviewedById: 'user-1',
				reviewedAt: expect.any(Date)
			}
		});
	});

	it('rejects a decision lost to a concurrent decision', async () => {
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			id: 'review-1',
			status: 'PENDING',
			requestedById: 'user-1',
			requestedBy: {
				id: 'user-1',
				name: 'Student',
				email: 'student@example.com'
			},
			task: {
				id: 'task-1',
				title: 'Build feature',
				project: { id: 'project-1', title: 'Project' }
			}
		} as never);
		mockDb.pullRequestReview.updateMany.mockResolvedValue({ count: 0 });
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.approve({ taskId: 'task-1' })).rejects.toMatchObject({
			code: 'CONFLICT'
		});
		expect(notifyPRResponse).not.toHaveBeenCalled();
	});

	it('closes a changes-requested review before creating the next version', async () => {
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			id: 'review-old',
			status: 'CHANGES_REQUESTED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.requestCodeReview({
			taskId: 'task-1',
			prUrl: 'https://github.com/acme/app/pull/2',
			idempotencyKey: '22222222-2222-4222-8222-222222222222'
		});

		expect(mockDb.pullRequestReview.update).toHaveBeenCalledWith({
			where: { id: 'review-old' },
			data: { isActive: false }
		});
		expect(mockDb.pullRequestReview.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				prUrl: 'https://github.com/acme/app/pull/2',
				requestedById: 'user-1',
				isActive: true
			})
		});
	});

	it('queues one AI analysis for the current linked pull request head', async () => {
		mockDb.pullRequestReview.findUnique.mockResolvedValue({
			id: 'review-1',
			isActive: true,
			status: 'PENDING',
			githubHeadSha: 'head-1',
			githubPullRequestNumber: 7,
			githubRepositoryId: 'repository-1'
		} as never);
		mockDb.prReviewAnalysis.findUnique.mockResolvedValue(null);
		mockDb.prReviewAnalysis.upsert.mockResolvedValue({
			id: 'analysis-1',
			status: 'QUEUED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.startAIAnalysis({ reviewId: 'review-1' });

		expect(mockDb.prReviewAnalysis.upsert).toHaveBeenCalledWith({
			where: {
				reviewId_sourceHeadSha: {
					reviewId: 'review-1',
					sourceHeadSha: 'head-1'
				}
			},
			create: {
				reviewId: 'review-1',
				requestedById: 'user-1',
				sourceHeadSha: 'head-1',
				promptVersion: 'p2.2-v1'
			},
			update: {},
			select: { id: true, status: true }
		});
	});

	it('does not queue an AI analysis without a linked GitHub pull request', async () => {
		mockDb.pullRequestReview.findUnique.mockResolvedValue({
			id: 'review-1',
			isActive: true,
			status: 'PENDING',
			githubHeadSha: null,
			githubPullRequestNumber: null,
			githubRepositoryId: null
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.startAIAnalysis({ reviewId: 'review-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		});
		expect(mockDb.prReviewAnalysis.create).not.toHaveBeenCalled();
	});

	it('lets the admin accept or discard a completed finding without deciding the review', async () => {
		mockDb.prReviewFinding.findUnique.mockResolvedValue({
			id: 'finding-1',
			analysis: {
				status: 'COMPLETED',
				review: { status: 'PENDING', isActive: true }
			}
		} as never);
		mockDb.prReviewFinding.update.mockResolvedValue({
			id: 'finding-1'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.reviewAIFinding({
			findingId: 'finding-1',
			decision: 'ACCEPTED',
			problem: 'Edited problem',
			suggestion: 'Edited suggestion'
		});

		expect(mockDb.prReviewFinding.update).toHaveBeenCalledWith({
			where: { id: 'finding-1' },
			data: {
				decision: 'ACCEPTED',
				editedProblem: 'Edited problem',
				editedSuggestion: 'Edited suggestion',
				decisionById: 'user-1',
				decidedAt: expect.any(Date)
			}
		});
		expect(mockDb.pullRequestReview.updateMany).not.toHaveBeenCalled();
	});

	it('marks feedback as AI-assisted only after accepted current findings are selected', async () => {
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			id: 'review-1',
			status: 'PENDING',
			githubHeadSha: 'head-1',
			requestedById: 'user-1',
			requestedBy: {
				id: 'user-1',
				name: 'Student',
				email: 'student@example.com'
			},
			task: {
				id: 'task-1',
				title: 'Build feature',
				project: { id: 'project-1', title: 'Project' }
			}
		} as never);
		mockDb.prReviewAnalysis.findUnique.mockResolvedValue({
			status: 'COMPLETED',
			reviewId: 'review-1',
			sourceHeadSha: 'head-1',
			findings: [{ id: 'finding-1' }]
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.requestChanges({
			taskId: 'task-1',
			comment: 'Please address the accepted finding.',
			analysisId: 'analysis-1'
		});

		expect(mockDb.pullRequestReview.updateMany).toHaveBeenCalledWith({
			where: { id: 'review-1', status: 'PENDING' },
			data: expect.objectContaining({
				status: 'CHANGES_REQUESTED',
				feedbackAssistedByAi: true
			})
		});
	});

	it('returns an idempotent retry without creating or charging again', async () => {
		mockDb.pullRequestReview.findUnique.mockResolvedValue({
			taskId: 'task-1',
			requestedById: 'user-1',
			prUrl: 'https://github.com/acme/app/pull/1'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.requestCodeReview({
			taskId: 'task-1',
			prUrl: 'https://github.com/acme/app/pull/1',
			idempotencyKey: '33333333-3333-4333-8333-333333333333'
		});

		expect(mockDb.$transaction).not.toHaveBeenCalled();
		expect(mockDb.pullRequestReview.create).not.toHaveBeenCalled();
		expect(mockDb.creditTransaction.createMany).not.toHaveBeenCalled();
	});
});
