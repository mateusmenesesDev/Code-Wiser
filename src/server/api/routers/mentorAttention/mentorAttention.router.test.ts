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
