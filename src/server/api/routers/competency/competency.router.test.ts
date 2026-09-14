import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { competencyRouter } from './competency.router';

const authState = vi.hoisted(() => ({
	userId: 'learner-1' as string | null,
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

describe('competency.getMatrix', () => {
	const createCaller = createCallerFactory(competencyRouter);

	beforeEach(() => {
		authState.userId = 'learner-1';
		authState.isAdmin = false;
		mockDb.userChallengeProgress.findMany.mockResolvedValue([]);
		mockDb.projectMembership.findMany.mockResolvedValue([]);
		mockDb.pullRequestReview.findMany.mockResolvedValue([]);
	});

	it('derives demonstrated progress from an approved mapped exercise', async () => {
		mockDb.competency.findMany.mockResolvedValue([
			{
				slug: 'testing',
				name: 'Testing',
				description: 'Protect behavior with tests.',
				exerciseChallenges: [{ challengeId: 'challenge-1' }],
				learningOutcomes: [],
				milestones: [],
				reviewCategories: [{ category: 'TESTS' }],
				mentorAssessments: []
			}
		] as never);
		mockDb.userChallengeProgress.findMany.mockResolvedValue([
			{
				challengeId: 'challenge-1',
				status: 'APPROVED',
				updatedAt: new Date('2026-08-22T12:00:00.000Z'),
				challenge: { title: 'Todo List', track: { name: 'React' } }
			}
		] as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getMatrix();

		expect(result[0]).toMatchObject({
			slug: 'testing',
			state: 'DEMONSTRATED',
			evidence: [
				expect.objectContaining({
					title: 'Todo List',
					source: 'EXERCISE'
				})
			]
		});
	});

	it('does not allow learners to inspect another learner matrix', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.getMatrix({ userId: 'learner-2' })
		).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(mockDb.competency.findMany).not.toHaveBeenCalled();
	});
});
