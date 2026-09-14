import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { mentorAttentionRouter } from './mentorAttention.router';

const authState = vi.hoisted(() => ({
	userId: 'admin-1' as string | null,
	isAdmin: true
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: authState.isAdmin ? { o: { rol: 'admin' } } : null,
		sessionId: authState.userId ? 'session-1' : null,
		getToken: () => Promise.resolve(authState.userId ? 'token' : null),
		has: ({ role }: { role: string }) =>
			authState.isAdmin && role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('mentorAttention.getQueue', () => {
	const createCaller = createCallerFactory(mentorAttentionRouter);

	beforeEach(() => {
		authState.userId = 'admin-1';
		authState.isAdmin = true;
		mockDb.pullRequestReview.findMany.mockResolvedValue([]);
		mockDb.exerciseReviewSubmission.findMany.mockResolvedValue([]);
		mockDb.task.findMany.mockResolvedValue([]);
		mockDb.user.findMany.mockResolvedValue([]);
		mockDb.mentorshipBooking.findMany.mockResolvedValue([]);
		mockDb.mentorAttentionAssignment.findMany.mockResolvedValue([]);
		mockDb.mentorAttentionAssignment.count.mockResolvedValue(0);
		mockDb.mentorAttentionAssignment.aggregate.mockResolvedValue({
			_avg: { firstResponseMinutes: null, completionMinutes: null }
		} as never);
	});

	it('combines bounded attention sources and returns direct actions', async () => {
		const createdAt = new Date('2026-08-01T12:00:00.000Z');
		mockDb.pullRequestReview.findMany.mockResolvedValue([
			{
				id: 'pr-1',
				createdAt,
				requestedBy: { id: 'student-1', name: 'Ada', email: 'ada@example.com' },
				task: {
					id: 'task-1',
					title: 'Build parser',
					priority: 'HIGH',
					project: { id: 'project-1', title: 'Compiler' }
				}
			}
		] as never);
		mockDb.exerciseReviewSubmission.findMany.mockResolvedValue([
			{
				id: 'exercise-1',
				createdAt: new Date('2026-08-02T12:00:00.000Z'),
				track: { id: 'track-1', name: 'TypeScript', slug: 'typescript' },
				submittedBy: {
					id: 'student-2',
					name: 'Grace',
					email: 'grace@example.com'
				},
				decisions: [{ id: 'decision-1', challenge: { title: 'Generics' } }]
			}
		] as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getQueue({ limit: 10 });

		expect(result.items).toHaveLength(2);
		expect(result.items[0]).toMatchObject({
			type: 'PR_REVIEW',
			priority: 'HIGH',
			directUrl: '/workspace/project-1?taskId=task-1'
		});
		expect(result.items[1]).toMatchObject({
			type: 'EXERCISE_REVIEW',
			priority: 'HIGH',
			directUrl: '/admin/exercise-reviews/exercise-1'
		});
		expect(mockDb.pullRequestReview.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ take: 11 })
		);
		expect(mockDb.exerciseReviewSubmission.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ take: 11 })
		);
	});

	it('claims an available item and records first response time', async () => {
		const createdAt = new Date('2026-08-13T08:00:00.000Z');
		const claimedAt = new Date('2026-08-13T10:00:00.000Z');
		vi.useFakeTimers();
		vi.setSystemTime(claimedAt);
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			createdAt
		} as never);
		mockDb.mentorAttentionAssignment.findUnique.mockResolvedValue(null);
		mockDb.mentorAttentionAssignment.count.mockResolvedValue(0);
		mockDb.mentorAttentionAssignment.create.mockResolvedValue({
			id: 'assignment-1'
		} as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.claim({
			sourceType: 'PR_REVIEW',
			sourceId: 'pr-1'
		});

		expect(result.success).toBe(true);
		expect(mockDb.mentorAttentionAssignment.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				sourceType: 'PR_REVIEW',
				sourceId: 'pr-1',
				assignedMentorId: 'admin-1',
				firstResponseMinutes: 120
			})
		});
		vi.useRealTimers();
	});

	it('enforces the fixed active-item capacity', async () => {
		mockDb.pullRequestReview.findFirst.mockResolvedValue({
			createdAt: new Date('2026-08-13T08:00:00.000Z')
		} as never);
		mockDb.mentorAttentionAssignment.findUnique.mockResolvedValue(null);
		mockDb.mentorAttentionAssignment.count.mockResolvedValue(5);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.claim({ sourceType: 'PR_REVIEW', sourceId: 'pr-1' })
		).rejects.toMatchObject({ code: 'CONFLICT' });
		expect(mockDb.mentorAttentionAssignment.create).not.toHaveBeenCalled();
	});

	it('returns mentor capacity and response metrics', async () => {
		mockDb.mentorAttentionAssignment.count
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(7)
			.mockResolvedValueOnce(4);
		mockDb.mentorAttentionAssignment.aggregate
			.mockResolvedValueOnce({ _avg: { firstResponseMinutes: 90 } } as never)
			.mockResolvedValueOnce({ _avg: { completionMinutes: 360 } } as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getSummary()).resolves.toEqual({
			capacity: { limit: 5, active: 2, remaining: 3 },
			metrics: {
				firstResponseCount: 7,
				completionCount: 4,
				averageFirstResponseMinutes: 90,
				averageCompletionMinutes: 360
			}
		});
	});

	it('releases only an item owned by the current mentor', async () => {
		mockDb.mentorAttentionAssignment.updateMany.mockResolvedValue({ count: 1 });
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.release({
				sourceType: 'EXERCISE_REVIEW',
				sourceId: 'submission-1'
			})
		).resolves.toEqual({ success: true });
		expect(mockDb.mentorAttentionAssignment.updateMany).toHaveBeenCalledWith({
			where: expect.objectContaining({ assignedMentorId: 'admin-1' }),
			data: { assignedMentorId: null, claimedAt: null }
		});
	});

	it('rejects non-admin callers before reading queue sources', async () => {
		authState.isAdmin = false;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getQueue({})).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(mockDb.pullRequestReview.findMany).not.toHaveBeenCalled();
	});
});
