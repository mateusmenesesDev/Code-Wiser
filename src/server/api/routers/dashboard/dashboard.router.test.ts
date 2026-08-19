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
