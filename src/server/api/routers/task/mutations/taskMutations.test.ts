import { TaskStatusEnum } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { taskRouter } from '../taskRouter';

vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/services/notification/notificationService', () => ({
	notifyTaskAssigned: vi.fn().mockResolvedValue(undefined),
	notifyTaskBlocked: vi.fn().mockResolvedValue(undefined),
	notifyTaskStatusChanged: vi.fn().mockResolvedValue(undefined)
}));

describe('task status transitions', () => {
	const createCaller = createCallerFactory(taskRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('assigns the user moving a task into In Progress', async () => {
		mockDb.task.findUnique
			.mockResolvedValueOnce({
				id: 'task-1',
				projectId: 'project-1',
				projectTemplateId: null,
				status: TaskStatusEnum.BACKLOG,
				kanbanRank: 1_000_000n,
				sprint: null
			} as never)
			.mockResolvedValueOnce({
				id: 'task-1',
				projectId: 'project-1',
				status: TaskStatusEnum.BACKLOG,
				kanbanRank: 1_000_000n,
				sprint: null
			} as never);
		mockDb.project.findUnique
			.mockResolvedValueOnce({
				memberships: [
					{ role: 'LEARNER', status: 'ACTIVE', joinedAt: new Date() }
				]
			} as never)
			.mockResolvedValueOnce({ canceledAt: null } as never);
		mockDb.task.findFirst.mockResolvedValue(null);
		mockDb.task.update.mockResolvedValue({} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.moveTask({
			projectId: 'project-1',
			taskId: 'task-1',
			targetStatus: TaskStatusEnum.IN_PROGRESS
		});

		expect(result).toEqual({ success: true, updatedCount: 1 });
		expect(mockDb.task.update).toHaveBeenCalledWith({
			where: { id: 'task-1' },
			data: {
				status: TaskStatusEnum.IN_PROGRESS,
				kanbanRank: 1_000_000n,
				assignees: { connect: { id: 'user-1' } }
			}
		});
	});

	it('keeps the mover assigned when the status is changed through task.update', async () => {
		mockDb.task.findUnique.mockResolvedValueOnce({
			id: 'task-1',
			projectId: 'project-1',
			projectTemplateId: null,
			status: TaskStatusEnum.BACKLOG,
			blocked: false,
			storyPoints: null,
			sprintId: null,
			type: 'USER_STORY',
			productVersionId: null,
			title: 'Task 1',
			sprint: null,
			project: {
				id: 'project-1',
				title: 'Project 1',
				memberships: [{ userId: 'user-1' }]
			},
			assignees: []
		} as never);
		mockDb.project.findUnique
			.mockResolvedValueOnce({
				memberships: [
					{ role: 'LEARNER', status: 'ACTIVE', joinedAt: new Date() }
				]
			} as never)
			.mockResolvedValueOnce({ canceledAt: null } as never);
		mockDb.task.findFirst.mockResolvedValue(null);
		mockDb.task.update.mockResolvedValue({
			id: 'task-1',
			title: 'Task 1',
			assignees: [{ id: 'user-1', name: 'User 1' }],
			project: { id: 'project-1', title: 'Project 1' }
		} as never);
		mockDb.user.findUnique.mockResolvedValue({ name: 'User 1' } as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		await caller.update({
			id: 'task-1',
			isTemplate: false,
			status: TaskStatusEnum.IN_PROGRESS
		});

		expect(mockDb.task.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					status: TaskStatusEnum.IN_PROGRESS,
					assignees: { set: [{ id: 'user-1' }] }
				})
			})
		);
	});
});
