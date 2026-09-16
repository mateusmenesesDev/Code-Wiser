import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { mentorFollowUpRouter } from './mentorFollowUp.router';

const authState = vi.hoisted(() => ({ userId: 'mentor-1' as string | null }));

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

describe('mentorFollowUp.getOverview', () => {
	const createCaller = createCallerFactory(mentorFollowUpRouter);
	const now = new Date('2026-09-20T12:00:00.000Z');

	beforeEach(() => {
		authState.userId = 'mentor-1';
		vi.useFakeTimers();
		vi.setSystemTime(now);
		mockDb.project.findMany.mockResolvedValue([]);
		mockDb.pullRequestReview.findMany.mockResolvedValue([]);
		mockDb.task.findMany.mockResolvedValue([]);
		mockDb.sprint.findMany.mockResolvedValue([]);
		mockDb.mentorshipBooking.findMany.mockResolvedValue([]);
		vi.mocked(mockDb.task.groupBy).mockResolvedValue([] as never);
	});

	it('scopes the overview to mentor projects and groups pending work by learner', async () => {
		mockDb.project.findMany.mockResolvedValue([
			{
				id: 'project-1',
				title: 'Portal',
				memberships: [
					{
						userId: 'learner-1',
						user: {
							id: 'learner-1',
							name: 'Ada Lovelace',
							email: 'ada@example.com'
						}
					}
				]
			}
		] as never);
		mockDb.pullRequestReview.findMany.mockResolvedValue([
			{
				id: 'review-1',
				createdAt: new Date('2026-09-18T12:00:00.000Z'),
				requestedBy: {
					id: 'learner-1',
					name: 'Ada Lovelace',
					email: 'ada@example.com'
				},
				task: {
					id: 'task-review',
					title: 'Add validation',
					projectId: 'project-1',
					project: { id: 'project-1', title: 'Portal' }
				}
			},
			{
				id: 'review-outside-scope',
				createdAt: new Date('2026-09-17T12:00:00.000Z'),
				requestedBy: {
					id: 'learner-2',
					name: 'Grace Hopper',
					email: 'grace@example.com'
				},
				task: {
					id: 'task-outside-scope',
					title: 'Private task',
					projectId: 'project-1',
					project: { id: 'project-1', title: 'Portal' }
				}
			}
		] as never);
		mockDb.task.findMany.mockResolvedValue([
			{
				id: 'task-overdue',
				title: 'Write tests',
				dueDate: new Date('2026-09-17T12:00:00.000Z'),
				status: 'IN_PROGRESS',
				priority: 'HIGH',
				projectId: 'project-1',
				project: { id: 'project-1', title: 'Portal' },
				sprint: { id: 'sprint-1', title: 'Sprint 1' },
				assignees: [
					{ id: 'learner-1', name: 'Ada Lovelace', email: 'ada@example.com' }
				]
			},
			{
				id: 'task-unassigned',
				title: 'Clarify scope',
				dueDate: new Date('2026-09-16T12:00:00.000Z'),
				status: 'IN_PROGRESS',
				priority: 'MEDIUM',
				projectId: 'project-1',
				project: { id: 'project-1', title: 'Portal' },
				sprint: null,
				assignees: []
			}
		] as never);
		mockDb.sprint.findMany.mockResolvedValue([
			{
				id: 'sprint-1',
				title: 'Sprint 1',
				endDate: new Date('2026-09-19T12:00:00.000Z'),
				projectId: 'project-1',
				project: { id: 'project-1', title: 'Portal' }
			}
		] as never);
		mockDb.mentorshipBooking.findMany.mockResolvedValue([
			{
				id: 'booking-1',
				userId: 'learner-1',
				scheduledAt: new Date('2026-09-22T12:00:00.000Z'),
				objective: null,
				meetingUrl: 'https://meet.example.com/1'
			}
		] as never);
		vi.mocked(mockDb.task.groupBy).mockImplementation((args) => {
			const by = (args as { by: string[] }).by;
			if (by.includes('status')) {
				return Promise.resolve([
					{ projectId: 'project-1', status: 'DONE', _count: { _all: 2 } },
					{ projectId: 'project-1', status: 'IN_PROGRESS', _count: { _all: 3 } }
				]) as never;
			}
			return Promise.resolve([
				{
					projectId: 'project-1',
					_max: { updatedAt: new Date('2026-09-19T10:00:00.000Z') }
				}
			]) as never;
		});

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getOverview();

		expect(result.mentorandos).toHaveLength(1);
		expect(result.mentorandos[0]).toMatchObject({
			learner: { id: 'learner-1', name: 'Ada Lovelace' },
			projects: [
				{
					id: 'project-1',
					title: 'Portal',
					totalTasks: 5,
					completedTasks: 2,
					progress: 40
				}
			],
			nextSession: { id: 'booking-1' }
		});
		expect(
			result.mentorandos[0]?.pendingItems.map((item) => item.type)
		).toEqual(['OVERDUE_TASK', 'PR_REVIEW']);
		expect(result.mentorandos[0]?.pendingItems[0]).toMatchObject({
			title: 'Write tests',
			href: '/workspace/project-1?taskId=task-overdue'
		});
		expect(result.projectPendingItems[0]?.project).toMatchObject({
			id: 'project-1'
		});
		expect(result.projectPendingItems[0]?.pendingItems).toMatchObject([
			{ type: 'OVERDUE_TASK', title: 'Clarify scope' },
			{ type: 'OVERDUE_SPRINT', title: 'Sprint 1' }
		]);
		expect(mockDb.project.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					canceledAt: null,
					memberships: {
						some: { userId: 'mentor-1', role: 'MENTOR', status: 'ACTIVE' }
					}
				}
			})
		);
	});

	it('returns no data for a user without an active mentor project', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getOverview()).resolves.toMatchObject({
			projects: [],
			mentorandos: [],
			projectPendingItems: []
		});
		expect(mockDb.pullRequestReview.findMany).not.toHaveBeenCalled();
		expect(mockDb.task.findMany).not.toHaveBeenCalled();
	});

	it('reports whether the user has an active mentor project', async () => {
		mockDb.projectMembership.count.mockResolvedValue(1);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getAccess()).resolves.toBe(true);
		expect(mockDb.projectMembership.count).toHaveBeenCalledWith({
			where: {
				userId: 'mentor-1',
				role: 'MENTOR',
				status: 'ACTIVE',
				project: { canceledAt: null }
			}
		});
	});
});
