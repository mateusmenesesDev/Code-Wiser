import { TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
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

describe('task subtasks', () => {
	const createCaller = createCallerFactory(taskRouter);

	it('requires a parent task for subtasks', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.create({
				projectId: 'project-1',
				title: 'Subtask without parent',
				type: TaskTypeEnum.SUBTASK,
				isTemplate: false
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
	});

	it('connects a new subtask to a parent in the same project', async () => {
		mockDb.project.findUnique
			.mockResolvedValueOnce({
				memberships: [{ role: 'LEARNER', status: 'ACTIVE', joinedAt: new Date() }]
			} as never)
			.mockResolvedValueOnce({ canceledAt: null } as never);
		mockDb.task.findUnique.mockResolvedValue({
			projectId: 'project-1',
			projectTemplateId: null,
			parentTaskId: null
		} as never);
		mockDb.project.update.mockResolvedValue({ nextTaskNumber: 2 } as never);
		mockDb.task.findFirst.mockResolvedValue(null);
		mockDb.task.create.mockResolvedValue({ id: 'subtask-1', storyPoints: null } as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		await caller.create({
			projectId: 'project-1',
			title: 'Implement the endpoint',
			type: TaskTypeEnum.SUBTASK,
			parentTaskId: 'task-1',
			isTemplate: false
		});
		expect(mockDb.task.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					parentTask: { connect: { id: 'task-1' } }
				})
			})
		);
	});
});

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

	it('updates a parent-linked task without requiring its stored type to be SUBTASK', async () => {
		mockDb.task.findUnique.mockResolvedValueOnce({
			id: 'subtask-1',
			projectId: 'project-1',
			projectTemplateId: null,
			parentTaskId: 'task-1',
			status: TaskStatusEnum.BACKLOG,
			blocked: false,
			storyPoints: null,
			sprintId: null,
			type: TaskTypeEnum.TASK,
			productVersionId: null,
			title: 'Subtask',
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
		mockDb.task.update.mockResolvedValue({
			id: 'subtask-1',
			title: 'Updated subtask',
			assignees: [],
			project: { id: 'project-1', title: 'Project 1' }
		} as never);
		mockDb.user.findUnique.mockResolvedValue({ name: 'User 1' } as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		await caller.update({
			id: 'subtask-1',
			projectId: 'project-1',
			title: 'Updated subtask',
			isTemplate: false
		});

		expect(mockDb.task.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ title: 'Updated subtask' })
			})
		);
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
