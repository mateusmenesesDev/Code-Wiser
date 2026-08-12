import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { dashboard } from './index';

const authState = vi.hoisted(() => ({ userId: 'user-1' as string | null }));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: null,
		sessionId: authState.userId ? 'session-1' : null,
		getToken: () => Promise.resolve(authState.userId ? 'token' : null),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('dashboard.getOverview', () => {
	const createCaller = createCallerFactory(dashboard);

	beforeEach(() => {
		authState.userId = 'user-1';
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
			{ id: 'project-1', title: 'Portal' }
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
		expect(result.projects[0]).toMatchObject({
			id: 'project-1',
			totalTasks: 5,
			completedTasks: 2,
			progress: 40
		});
		expect(result.notifications).toEqual([]);
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
