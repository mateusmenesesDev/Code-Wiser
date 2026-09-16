import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { dashboard } from './index';

const authState = vi.hoisted(() => ({
	userId: 'user-1' as string | null,
	isAdmin: false
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: authState.isAdmin ? { o: { rol: 'admin' } } : null,
		sessionId: authState.userId ? 'session-1' : null,
		getToken: () => Promise.resolve(authState.userId ? 'token' : null),
		has: () => authState.isAdmin
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('dashboard.getOverview', () => {
	const createCaller = createCallerFactory(dashboard);

	beforeEach(() => {
		authState.userId = 'user-1';
		authState.isAdmin = false;
		mockDb.competency.findMany.mockResolvedValue([]);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([]);
		mockDb.projectMembership.findMany.mockResolvedValue([]);
		mockDb.pullRequestReview.findMany.mockResolvedValue([]);
		mockDb.exerciseReviewDecision.findFirst.mockResolvedValue(null);
		mockDb.remediationAction.findMany.mockResolvedValue([]);
	});

	it('returns the authenticated learner overview with project progress', async () => {
		mockDb.task.findFirst.mockResolvedValue({
			id: 'task-1',
			title: 'Build form',
			status: 'IN_PROGRESS',
			priority: 'HIGH',
			dueDate: null,
			project: { id: 'project-1', title: 'Portal' }
		} as never);
		mockDb.project.findMany.mockResolvedValue([
			{
				id: 'project-1',
				title: 'Portal',
				description: 'Build a customer portal',
				sprints: [
					{
						title: 'Sprint 1',
						endDate: null,
						committedPoints: 8,
						tasks: [
							{ status: 'DONE', storyPoints: 3 },
							{ status: 'IN_PROGRESS', storyPoints: 5 }
						]
					}
				]
			}
		] as never);
		mockDb.userChallengeProgress.findFirst.mockResolvedValue(null);
		mockDb.pullRequestReview.findFirst.mockResolvedValue(null);
		mockDb.mentorshipBooking.findFirst.mockResolvedValue(null);
		mockDb.notification.findMany.mockResolvedValue([]);
		vi.mocked(mockDb.task.groupBy).mockImplementation((args) => {
			const by = (args as { by: string[] }).by;
			if (by.includes('status')) {
				return Promise.resolve([
					{ projectId: 'project-1', status: 'DONE', _count: { _all: 2 } },
					{
						projectId: 'project-1',
						status: 'IN_PROGRESS',
						_count: { _all: 3 }
					}
				]) as never;
			}
			return Promise.resolve([
				{
					projectId: 'project-1',
					_max: { updatedAt: new Date('2026-01-02T00:00:00.000Z') }
				}
			]) as never;
		});

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getOverview();

		expect(result.urgentTask?.id).toBe('task-1');
		expect(result.currentSprint).toMatchObject({
			title: 'Sprint 1',
			completedPoints: 3,
			totalPoints: 8
		});
		expect(result.projects[0]).toMatchObject({
			id: 'project-1',
			totalTasks: 5,
			completedTasks: 2,
			progress: 40
		});
		expect(result.notifications).toEqual([]);
	});

	it('returns an exercise recommendation grounded in recent review feedback', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			name: 'Learner',
			email: 'learner@example.com',
			learningGoal: 'PREPARE_FOR_INTERVIEWS',
			weeklyAvailabilityBand: 'UNDER_3',
			interestedTechnologies: ['REACT']
		} as never);
		mockDb.task.findFirst.mockResolvedValue(null);
		mockDb.project.findMany.mockResolvedValue([]);
		mockDb.userChallengeProgress.findFirst.mockResolvedValue(null);
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			id: 'review-1',
			status: 'CHANGES_REQUESTED',
			reviewedAt: new Date('2026-08-23T12:00:00.000Z'),
			updatedAt: new Date('2026-08-23T12:00:00.000Z'),
			comment: 'Add integration coverage.',
			task: {
				id: 'task-1',
				title: 'Build form',
				projectId: null,
				project: null
			},
			analyses: [{ findings: [{ category: 'TESTS', editedCategory: null }] }]
		} as never);
		mockDb.mentorshipBooking.findFirst.mockResolvedValue(null);
		mockDb.notification.findMany.mockResolvedValue([]);
		mockDb.competency.findMany.mockResolvedValue([
			{
				slug: 'testing',
				name: 'Testing',
				description: 'Use tests to protect behavior.',
				sortOrder: 1,
				exerciseChallenges: [
					{
						challengeId: 'challenge-1',
						challenge: {
							id: 'challenge-1',
							title: 'Todo list tests',
							slug: 'todo-list',
							difficulty: 'EASY',
							sortOrder: 0,
							isArchived: false,
							track: {
								name: 'React',
								slug: 'react',
								isPublished: true,
								isArchived: false
							},
							progress: []
						}
					}
				],
				learningOutcomes: [],
				milestones: [],
				reviewCategories: [{ category: 'TESTS' }],
				mentorAssessments: []
			}
		] as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getOverview();

		expect(result.learningRecommendation).toMatchObject({
			kind: 'EXERCISE',
			title: 'Todo list tests',
			competency: { slug: 'testing' },
			reason: 'FEEDBACK',
			feedback: 'Add integration coverage.'
		});
	});

	it('lets admins view another user dashboard', async () => {
		authState.isAdmin = true;
		mockDb.user.findUnique.mockResolvedValue({
			name: 'Ada Lovelace',
			email: 'ada@example.com'
		} as never);
		mockDb.task.findFirst.mockResolvedValue(null);
		mockDb.project.findMany.mockResolvedValue([]);
		mockDb.userChallengeProgress.findFirst.mockResolvedValue(null);
		mockDb.pullRequestReview.findFirst.mockResolvedValue(null);
		mockDb.mentorshipBooking.findFirst.mockResolvedValue(null);
		mockDb.notification.findMany.mockResolvedValue([]);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getOverview({ userId: 'user-2' });

		expect(result.viewedUser).toEqual({
			name: 'Ada Lovelace',
			email: 'ada@example.com'
		});
		expect(mockDb.project.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					canceledAt: null,
					memberships: { some: { userId: 'user-2', status: 'ACTIVE' } }
				}
			})
		);
	});

	it('rejects a non-admin target user request before querying dashboard data', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.getOverview({ userId: 'user-2' })
		).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(mockDb.user.findUnique).not.toHaveBeenCalled();
		expect(mockDb.project.findMany).not.toHaveBeenCalled();
	});

	it('rejects anonymous callers before querying the dashboard data', async () => {
		authState.userId = null;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getOverview()).rejects.toMatchObject({
			code: 'UNAUTHORIZED'
		});
		expect(mockDb.project.findMany).not.toHaveBeenCalled();
	});
});

describe('dashboard.recordRecommendationEvent', () => {
	const createCaller = createCallerFactory(dashboard);

	it('records a recommendation start and the first learning action idempotently', async () => {
		authState.userId = 'learner-1';
		authState.isAdmin = false;
		mockDb.learningJourneyEvent.upsert.mockResolvedValue({} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		await expect(
			caller.recordRecommendationEvent({
				eventType: 'STARTED',
				recommendationKey: 'EXERCISE|GOAL|/exercises/react/testing|testing'
			})
		).resolves.toEqual({ success: true });

		expect(mockDb.learningJourneyEvent.upsert).toHaveBeenCalledTimes(2);
		expect(mockDb.learningJourneyEvent.upsert).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				where: {
					eventKey:
						'recommendation:RECOMMENDATION_STARTED:learner-1:EXERCISE|GOAL|/exercises/react/testing|testing'
				}
			})
		);
		expect(mockDb.learningJourneyEvent.upsert).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				where: { eventKey: 'first-action:learner-1' }
			})
		);
	});
});

describe('dashboard.getLearningMetrics', () => {
	const createCaller = createCallerFactory(dashboard);

	it('returns bounded learning health counts to admins', async () => {
		authState.userId = 'admin-1';
		authState.isAdmin = true;
		mockDb.user.count.mockResolvedValue(12);
		mockDb.competencyMentorAssessment.findMany
			.mockResolvedValueOnce([
				{ learnerId: 'learner-1' },
				{ learnerId: 'learner-2' }
			] as never)
			.mockResolvedValueOnce([] as never);
		vi.mocked(mockDb.remediationAction.groupBy).mockResolvedValue([
			{ status: 'OPEN', _count: { _all: 3 } },
			{ status: 'COMPLETED', _count: { _all: 5 } }
		] as never);
		mockDb.remediationAction.count.mockResolvedValue(4);
		mockDb.mentorAttentionAssignment.count.mockResolvedValue(2);
		mockDb.mentorAttentionAssignment.aggregate.mockResolvedValue({
			_avg: { firstResponseMinutes: 90, completionMinutes: 180 }
		} as never);
		mockDb.learningJourneyEvent.count.mockResolvedValue(0);
		mockDb.learningJourneyEvent.findMany.mockResolvedValue([] as never);
		vi.mocked(mockDb.cohortPeerReview.groupBy).mockResolvedValue([
			{ status: 'SUBMITTED', _count: { _all: 7 } }
		] as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getLearningMetrics()).resolves.toEqual({
			diagnosedLearners: 12,
			learnersWithDemonstratedCompetency: 2,
			remediationByStatus: { OPEN: 3, COMPLETED: 5 },
			remediationReassessments: 4,
			overdueMentorAttentionItems: 2,
			peerReviewsByStatus: { SUBMITTED: 7 },
			journeyFunnel: {
				firstActionLearners: 0,
				recommendationImpressions: 0,
				recommendationStarts: 0,
				remediationCompleted: 5,
				secondEvaluationsApproved: 0
			},
			journeyRates: {
				diagnosisToFirstAction: 0,
				recommendationImpressionToStart: null,
				remediationCompletion: 63,
				secondEvaluationApproval: 0
			},
			journeyTiming: {
				averageSignupToFirstActionMinutes: null,
				averageDiagnosisToEvidenceMinutes: null,
				averageReviewResponseMinutes: 90,
				averageReviewCompletionMinutes: 180,
				reviewResponseCount: 2,
				reviewCompletionCount: 2
			}
		});
	});
});
