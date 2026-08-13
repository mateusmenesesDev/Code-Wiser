import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { agendaRouter } from './index';

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

describe('agenda procedures', () => {
	const createCaller = createCallerFactory(agendaRouter);

	beforeEach(() => {
		authState.userId = 'user-1';
		mockDb.project.findMany.mockResolvedValue([
			{
				id: 'project-1',
				title: 'Portal',
				sprints: [
					{ id: 'sprint-1', title: 'Sprint 1', projectId: 'project-1' }
				],
				memberships: [
					{
						user: {
							id: 'user-1',
							name: 'Learner',
							email: 'learner@example.com'
						}
					}
				]
			}
		] as never);
		mockDb.user.findUnique.mockResolvedValue({
			taskDeadlineRemindersEnabled: true
		} as never);
		mockDb.task.findMany.mockResolvedValue([
			{
				id: 'task-1',
				title: 'Build form',
				dueDate: new Date('2026-08-13T00:00:00.000Z'),
				status: 'IN_PROGRESS',
				priority: 'HIGH',
				projectId: 'project-1',
				sprintId: 'sprint-1',
				project: { id: 'project-1', title: 'Portal' },
				sprint: { id: 'sprint-1', title: 'Sprint 1' },
				assignees: [
					{ id: 'user-1', name: 'Learner', email: 'learner@example.com' }
				]
			}
		] as never);
	});

	it('returns only open tasks in accessible projects for the selected period', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		const result = await caller.getOverview({
			period: 'today',
			date: '2026-08-13'
		});

		expect(result.tasks).toHaveLength(1);
		expect(result.projects).toEqual([{ id: 'project-1', title: 'Portal' }]);
		expect(result.remindersEnabled).toBe(true);
		expect(mockDb.task.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					projectId: { in: ['project-1'] },
					status: { not: 'DONE' },
					dueDate: {
						gte: new Date('2026-08-13T00:00:00.000Z'),
						lt: new Date('2026-08-14T00:00:00.000Z'),
						not: null
					}
				})
			})
		);
	});

	it('does not query tasks for an inaccessible project filter', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		const result = await caller.getOverview({
			period: 'today',
			date: '2026-08-13',
			projectId: 'project-2'
		});

		expect(result.tasks).toEqual([]);
		expect(mockDb.task.findMany).not.toHaveBeenCalled();
	});

	it('updates the authenticated user reminder preference', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.updateReminderPreference({ enabled: false });

		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: { taskDeadlineRemindersEnabled: false }
		});
	});
});
