import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { cohortRouter } from './cohort.router';

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

const createCaller = createCallerFactory(cohortRouter);

const adminAuth = () => ({
	userId: 'admin-user',
	sessionClaims: { o: { rol: 'admin' } },
	sessionId: 'session-id',
	has: ({ role }: { role: string }) => role === 'org:admin'
});

const learnerAuth = (userId: string) => ({
	userId,
	sessionClaims: null,
	sessionId: 'session-id',
	has: () => false
});

beforeEach(() => {
	mockAuth.mockReturnValue(adminAuth());
});

describe('cohort.create', () => {
	it('creates an admin-managed draft cohort', async () => {
		mockDb.cohort.create.mockResolvedValue({
			id: 'cohort-1',
			name: 'September cohort',
			status: 'DRAFT'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		const result = await caller.create({
			name: 'September cohort',
			description: 'Practice together',
			startsAt: new Date('2026-09-01T00:00:00.000Z'),
			endsAt: null
		});

		expect(result).toEqual({
			id: 'cohort-1',
			name: 'September cohort',
			status: 'DRAFT'
		});
		expect(mockDb.cohort.create).toHaveBeenCalledWith({
			data: {
				name: 'September cohort',
				description: 'Practice together',
				startsAt: new Date('2026-09-01T00:00:00.000Z'),
				endsAt: null,
				createdById: 'admin-user'
			},
			select: { id: true, name: true, status: true }
		});
	});
});

describe('cohort.createEvent', () => {
	it('creates a scheduled checkpoint inside an active cohort', async () => {
		const startsAt = new Date('2026-09-10T18:00:00.000Z');
		mockDb.cohort.findUnique.mockResolvedValue({
			status: 'ACTIVE',
			startsAt: new Date('2026-09-01T00:00:00.000Z'),
			endsAt: new Date('2026-09-30T23:59:59.000Z')
		} as never);
		mockDb.cohortEvent.create.mockResolvedValue({
			id: 'event-1',
			type: 'CHECKPOINT',
			status: 'PLANNED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.createEvent({
				cohortId: 'cohort-1',
				type: 'CHECKPOINT',
				title: 'Midpoint check-in',
				description: 'Review progress and blockers.',
				startsAt
			})
		).resolves.toEqual({
			id: 'event-1',
			type: 'CHECKPOINT',
			status: 'PLANNED'
		});
		expect(mockDb.cohortEvent.create).toHaveBeenCalledWith({
			data: {
				cohortId: 'cohort-1',
				type: 'CHECKPOINT',
				title: 'Midpoint check-in',
				description: 'Review progress and blockers.',
				startsAt,
				endsAt: null,
				createdById: 'admin-user'
			},
			select: { id: true, type: true, status: true }
		});
	});
});

describe('cohort.updateEvent', () => {
	it('updates a planned event while preserving cohort boundaries', async () => {
		const startsAt = new Date('2026-09-12T18:00:00.000Z');
		mockDb.cohortEvent.findUnique.mockResolvedValue({
			cohort: {
				status: 'ACTIVE',
				startsAt: new Date('2026-09-01T00:00:00.000Z'),
				endsAt: new Date('2026-09-30T23:59:59.000Z')
			}
		} as never);
		mockDb.cohortEvent.update.mockResolvedValue({
			id: 'event-1',
			type: 'DELIVERY',
			status: 'PLANNED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.updateEvent({
				id: 'event-1',
				type: 'DELIVERY',
				title: 'First delivery',
				description: 'Submit the first increment.',
				startsAt
			})
		).resolves.toEqual({
			id: 'event-1',
			type: 'DELIVERY',
			status: 'PLANNED'
		});
		expect(mockDb.cohortEvent.update).toHaveBeenCalledWith({
			where: { id: 'event-1' },
			data: {
				type: 'DELIVERY',
				title: 'First delivery',
				description: 'Submit the first increment.',
				startsAt,
				endsAt: null
			},
			select: { id: true, type: true, status: true }
		});
	});
});

describe('cohort.getMyCohortTimeline', () => {
	it('returns scheduled events only for active cohort members', async () => {
		mockAuth.mockReturnValue(learnerAuth('learner-1'));
		mockDb.cohortEvent.findMany.mockResolvedValue([
			{
				id: 'event-1',
				type: 'KICKOFF',
				status: 'PLANNED',
				title: 'Welcome session',
				description: null,
				startsAt: new Date('2026-09-01T18:00:00.000Z'),
				endsAt: null,
				cohort: { id: 'cohort-1', name: 'September', status: 'ACTIVE' }
			}
		] as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getMyCohortTimeline()).resolves.toEqual([
			expect.objectContaining({ id: 'event-1', type: 'KICKOFF' })
		]);
		expect(mockDb.cohortEvent.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					cohort: {
						status: { in: ['ACTIVE', 'COMPLETED'] },
						memberships: {
							some: { userId: 'learner-1', status: 'ACTIVE' }
						}
					}
				}
			})
		);
	});
});

describe('cohort.completeEvent', () => {
	it('completes the closure event and closes the cohort atomically', async () => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.cohortEvent.findUnique.mockResolvedValue({
			id: 'event-1',
			type: 'CLOSURE',
			status: 'PLANNED',
			cohortId: 'cohort-1'
		} as never);
		mockDb.cohortEvent.update.mockResolvedValue({
			id: 'event-1',
			type: 'CLOSURE',
			status: 'COMPLETED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.completeEvent({ eventId: 'event-1' })).resolves.toEqual(
			{
				id: 'event-1',
				type: 'CLOSURE',
				status: 'COMPLETED'
			}
		);
		expect(mockDb.cohort.update).toHaveBeenCalledWith({
			where: { id: 'cohort-1' },
			data: { status: 'COMPLETED' }
		});
	});
});

describe('cohort.listPeerReviewSuggestions', () => {
	it('ranks calibrated, competent, available learners and excludes conflicts', async () => {
		mockDb.cohort.findUnique.mockResolvedValue({
			status: 'ACTIVE',
			memberships: [
				{
					userId: 'author-1',
					user: {
						id: 'author-1',
						name: 'Author',
						email: 'author@example.com',
						weeklyAvailabilityBand: 'FROM_4_TO_7'
					}
				},
				{
					userId: 'candidate-1',
					user: {
						id: 'candidate-1',
						name: 'Reviewer',
						email: 'reviewer@example.com',
						weeklyAvailabilityBand: 'FROM_8_TO_12'
					}
				}
			]
		} as never);
		mockDb.pullRequestReview.findUnique.mockResolvedValue({
			requestedById: 'author-1',
			task: {
				projectId: 'project-1',
				project: {
					githubRepository: { private: false },
					memberships: [],
					learningOutcomes: [],
					milestones: []
				}
			},
			analyses: [
				{
					findings: [{ category: 'TESTS', editedCategory: null }]
				}
			]
		} as never);
		mockDb.cohortPeerReview.findMany
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([{ reviewerId: 'candidate-1' }] as never)
			.mockResolvedValueOnce([]);
		mockDb.competency.findMany.mockResolvedValue([
			{
				id: 'competency-1',
				reviewCategories: [{ category: 'TESTS' }],
				mentorAssessments: [{ learnerId: 'candidate-1' }]
			}
		] as never);
		mockDb.cohortPeerReviewCalibration.findMany.mockResolvedValue([
			{ reviewerId: 'candidate-1' }
		] as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.listPeerReviewSuggestions({
				cohortId: 'cohort-1',
				pullRequestReviewId: 'pr-review-1'
			})
		).resolves.toMatchObject([
			{
				userId: 'candidate-1',
				competencyScore: 1,
				activeAssignmentCount: 1,
				calibrationPassed: true
			}
		]);
	});
});

describe('cohort.assignPeerReview', () => {
	const input = {
		cohortId: 'cohort-1',
		reviewerId: 'reviewer-1',
		pullRequestReviewId: 'pr-review-1'
	};

	it('assigns a public project review to a different active cohort member', async () => {
		mockDb.cohort.findUnique.mockResolvedValue({
			status: 'ACTIVE',
			memberships: [{ userId: 'reviewer-1' }]
		} as never);
		mockDb.pullRequestReview.findUnique.mockResolvedValue({
			requestedById: 'author-1',
			isActive: true,
			task: {
				projectId: 'project-1',
				project: { githubRepository: { private: false }, memberships: [] }
			}
		} as never);
		mockDb.cohortMembership.findUnique.mockResolvedValue({
			userId: 'author-1',
			status: 'ACTIVE'
		} as never);
		mockDb.cohortPeerReview.findUnique.mockResolvedValue(null);
		mockDb.cohortPeerReview.create.mockResolvedValue({
			id: 'assignment-1',
			status: 'ASSIGNED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.assignPeerReview(input)).resolves.toEqual({
			id: 'assignment-1',
			status: 'ASSIGNED'
		});
		expect(mockDb.cohortPeerReview.create).toHaveBeenCalledWith({
			data: {
				cohortId: 'cohort-1',
				pullRequestReviewId: 'pr-review-1',
				reviewerId: 'reviewer-1',
				authorId: 'author-1'
			},
			select: { id: true, status: true }
		});
		expect(mockDb.pullRequestReview.update).not.toHaveBeenCalled();
	});

	it('blocks private project reviews when the reviewer lacks project access', async () => {
		mockDb.cohort.findUnique.mockResolvedValue({
			status: 'ACTIVE',
			memberships: [{ userId: 'reviewer-1' }]
		} as never);
		mockDb.pullRequestReview.findUnique.mockResolvedValue({
			requestedById: 'author-1',
			isActive: true,
			task: {
				projectId: 'project-1',
				project: { githubRepository: { private: true }, memberships: [] }
			}
		} as never);
		mockDb.cohortMembership.findUnique.mockResolvedValue({
			userId: 'author-1',
			status: 'ACTIVE'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.assignPeerReview(input)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(mockDb.cohortPeerReview.create).not.toHaveBeenCalled();
	});
});

describe('cohort peer review calibration', () => {
	it('returns the rubric, examples, checklist, and current cohort result', async () => {
		mockAuth.mockReturnValue(learnerAuth('reviewer-1'));
		mockDb.cohortMembership.findUnique.mockResolvedValue({
			id: 'membership-1',
			status: 'ACTIVE'
		} as never);
		mockDb.cohortPeerReviewCalibration.findUnique.mockResolvedValue({
			attemptCount: 1,
			score: 3,
			total: 3,
			passed: true
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.getPeerReviewCalibration({ cohortId: 'cohort-1' })
		).resolves.toMatchObject({
			passed: true,
			attemptCount: 1,
			score: 3,
			total: 3,
			rubric: expect.arrayContaining([
				expect.objectContaining({ category: 'TESTS' })
			]),
			checklist: expect.arrayContaining([expect.any(String)]),
			prompts: expect.arrayContaining([
				expect.objectContaining({ id: expect.any(String) })
			])
		});
	});

	it('records a failed answer while applying the passing threshold', async () => {
		mockAuth.mockReturnValue(learnerAuth('reviewer-1'));
		mockDb.cohortMembership.findUnique.mockResolvedValue({
			id: 'membership-1',
			status: 'ACTIVE'
		} as never);
		mockDb.cohortPeerReviewCalibration.upsert.mockResolvedValue({
			attemptCount: 1,
			score: 2,
			total: 3,
			passed: true
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.completePeerReviewCalibration({
				cohortId: 'cohort-1',
				answers: [
					{ promptId: 'tests-missing-error-path', category: 'SECURITY' },
					{ promptId: 'security-unvalidated-input', category: 'SECURITY' },
					{ promptId: 'readability-duplicated-branch', category: 'READABILITY' }
				]
			})
		).resolves.toMatchObject({ score: 2, total: 3, passed: true });
	});

	it('records a passing calibration attempt from exact prompt answers', async () => {
		mockAuth.mockReturnValue(learnerAuth('reviewer-1'));
		mockDb.cohortMembership.findUnique.mockResolvedValue({
			id: 'membership-1',
			status: 'ACTIVE'
		} as never);
		mockDb.cohortPeerReviewCalibration.upsert.mockResolvedValue({
			attemptCount: 1,
			score: 3,
			total: 3,
			passed: true
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.completePeerReviewCalibration({
				cohortId: 'cohort-1',
				answers: [
					{ promptId: 'tests-missing-error-path', category: 'TESTS' },
					{ promptId: 'security-unvalidated-input', category: 'SECURITY' },
					{ promptId: 'readability-duplicated-branch', category: 'READABILITY' }
				]
			})
		).resolves.toMatchObject({ score: 3, total: 3, passed: true });
		expect(mockDb.cohortPeerReviewCalibration.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					cohortId_reviewerId_version: {
						cohortId: 'cohort-1',
						reviewerId: 'reviewer-1',
						version: 1
					}
				},
				create: expect.objectContaining({
					cohortId: 'cohort-1',
					reviewerId: 'reviewer-1',
					version: 1,
					score: 3,
					total: 3,
					passed: true,
					attemptCount: 1
				})
			})
		);
	});
});

describe('cohort peer review lifecycle', () => {
	it('blocks feedback submission until the reviewer passes calibration', async () => {
		mockAuth.mockReturnValue(learnerAuth('reviewer-1'));
		mockDb.cohortPeerReview.findFirst.mockResolvedValue({
			id: 'assignment-1',
			cohortId: 'cohort-1'
		} as never);
		mockDb.cohortPeerReviewCalibration.findUnique.mockResolvedValue(null);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.submitPeerReview({
				assignmentId: 'assignment-1',
				feedback:
					'Your tests cover the main path. Add a case for the failed request.'
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.cohortPeerReview.updateMany).not.toHaveBeenCalled();
	});

	it('lets only the assigned reviewer submit advisory feedback after calibration', async () => {
		mockAuth.mockReturnValue(learnerAuth('reviewer-1'));
		mockDb.cohortPeerReview.findFirst.mockResolvedValue({
			id: 'assignment-1',
			cohortId: 'cohort-1'
		} as never);
		mockDb.cohortPeerReviewCalibration.findUnique.mockResolvedValue({
			passed: true
		} as never);
		mockDb.cohortPeerReview.updateMany.mockResolvedValue({ count: 1 });
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.submitPeerReview({
				assignmentId: 'assignment-1',
				feedback:
					'Your tests cover the main path. Add a case for the failed request.'
			})
		).resolves.toEqual({ submitted: true });
		expect(mockDb.cohortPeerReview.updateMany).toHaveBeenCalledWith({
			where: {
				id: 'assignment-1',
				reviewerId: 'reviewer-1',
				status: 'ASSIGNED'
			},
			data: expect.objectContaining({
				status: 'SUBMITTED',
				feedback:
					'Your tests cover the main path. Add a case for the failed request.',
				submittedAt: expect.any(Date)
			})
		});
		expect(mockDb.pullRequestReview.update).not.toHaveBeenCalled();
	});

	it('does not expose dismissed feedback to the learner', async () => {
		mockAuth.mockReturnValue(learnerAuth('author-1'));
		mockDb.cohortPeerReview.findMany
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([]);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getMyPeerReviews()).resolves.toEqual({
			assigned: [],
			received: []
		});
		expect(mockDb.cohortPeerReview.findMany.mock.calls[1]?.[0]).toEqual(
			expect.objectContaining({
				where: expect.objectContaining({
					authorId: 'author-1',
					status: 'SUBMITTED'
				})
			})
		);
	});

	it('reports submitted feedback to cohort moderation', async () => {
		mockAuth.mockReturnValue(learnerAuth('author-1'));
		mockDb.cohortPeerReview.findFirst.mockResolvedValue({
			id: 'assignment-1'
		} as never);
		mockDb.cohortPeerReviewReport.findUnique.mockResolvedValue(null);
		mockDb.cohortPeerReviewReport.create.mockResolvedValue({
			id: 'report-1',
			status: 'OPEN'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.reportPeerReview({
				assignmentId: 'assignment-1',
				reason: 'This feedback contains personal attacks.'
			})
		).resolves.toEqual({ id: 'report-1', status: 'OPEN' });
		expect(mockDb.cohortPeerReviewReport.create).toHaveBeenCalledWith({
			data: {
				assignmentId: 'assignment-1',
				reporterId: 'author-1',
				reason: 'This feedback contains personal attacks.'
			},
			select: { id: true, status: true }
		});
	});
});

describe('cohort collaborative projects', () => {
	it('assigns a free project and enrolls active cohort members', async () => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.cohort.findUnique.mockResolvedValue({
			status: 'ACTIVE',
			memberships: [{ userId: 'learner-1' }]
		} as never);
		mockDb.project.findUnique.mockResolvedValue({
			id: 'project-1',
			title: 'Shared project',
			accessType: 'FREE',
			maxParticipants: 3,
			canceledAt: null,
			memberships: []
		} as never);
		mockDb.cohortProject.findUnique.mockResolvedValue(null);
		mockDb.cohortProject.create.mockResolvedValue({
			id: 'cohort-project-1'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.assignProject({ cohortId: 'cohort-1', projectId: 'project-1' })
		).resolves.toEqual({
			id: 'cohort-project-1',
			projectId: 'project-1',
			enrolledMembers: 1
		});
		expect(mockDb.projectMembership.upsert).toHaveBeenCalledWith({
			where: {
				projectId_userId: { projectId: 'project-1', userId: 'learner-1' }
			},
			create: {
				projectId: 'project-1',
				userId: 'learner-1',
				role: 'LEARNER'
			},
			update: { role: 'LEARNER', status: 'ACTIVE', joinedAt: expect.any(Date) }
		});
	});
});

describe('cohort peer review moderation', () => {
	it('dismisses reported feedback and resolves its report', async () => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.cohortPeerReviewReport.findUnique.mockResolvedValue({
			id: 'report-1',
			assignmentId: 'assignment-1',
			status: 'OPEN'
		} as never);
		mockDb.cohortPeerReviewReport.update.mockResolvedValue({
			id: 'report-1',
			status: 'RESOLVED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.resolvePeerReviewReport({
				reportId: 'report-1',
				status: 'RESOLVED',
				resolutionNote: 'Feedback violated the cohort rules.'
			})
		).resolves.toEqual({ id: 'report-1', status: 'RESOLVED' });
		expect(mockDb.cohortPeerReview.update).toHaveBeenCalledWith({
			where: { id: 'assignment-1' },
			data: {
				status: 'DISMISSED',
				dismissedAt: expect.any(Date),
				dismissedById: 'admin-user'
			}
		});
	});
});
