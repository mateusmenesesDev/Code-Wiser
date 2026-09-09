import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { prReviewRouter } from '../prReviewRouter';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'admin-user-id',
		sessionClaims: { o: { rol: 'admin' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: ({ role }: { role: string }) => role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

describe('prReview.getAll', () => {
	const createCaller = createCallerFactory(prReviewRouter);

	beforeEach(() => {
		mockDb.pullRequestReview.findMany.mockResolvedValue([] as never);
	});

	it('filters reviews by project', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.getAll({ projectId: 'project-1' });

		expect(mockDb.pullRequestReview.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					task: { projectId: 'project-1' }
				}
			})
		);
	});
});

describe('prReview.getActiveByTaskId', () => {
	const createCaller = createCallerFactory(prReviewRouter);

	beforeEach(() => {
		mockDb.task.findUnique.mockResolvedValue({
			id: 'task-1',
			projectId: 'project-1',
			project: {
				memberships: [{ userId: 'admin-user-id', status: 'ACTIVE' }]
			}
		} as never);
		mockDb.pullRequestReview.findFirst.mockResolvedValue(null);
	});

	it('returns only the current review for the signed-in student', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.getActiveByTaskId({ taskId: 'task-1' });

		expect(mockDb.pullRequestReview.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					taskId: 'task-1',
					requestedById: 'admin-user-id',
					isActive: true
				}
			})
		);
	});
});
