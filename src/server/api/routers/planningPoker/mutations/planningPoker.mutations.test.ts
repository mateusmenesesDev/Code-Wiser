import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { planningPokerRouter } from '../planningPokerRouter';

const realtime = vi.hoisted(() => ({
	trigger: vi.fn()
}));
const authState = vi.hoisted(() => ({ isAdmin: false }));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { o: { rol: 'member' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => authState.isAdmin
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => realtime
}));

describe('planningPoker.vote realtime', () => {
	const createCaller = createCallerFactory(planningPokerRouter);

	beforeEach(() => {
		authState.isAdmin = false;
		realtime.trigger.mockResolvedValue(undefined);
	});

	it('broadcasts vote changes on the presence channel used by room members', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1'],
			currentTaskIndex: 0
		} as never);
		mockDb.project.findUnique
			.mockResolvedValueOnce({ memberships: [{ userId: 'user-1', role: 'LEARNER', status: 'ACTIVE', joinedAt: new Date() }] } as never)
			.mockResolvedValueOnce({ canceledAt: null } as never);
		mockDb.planningPokerVote.upsert.mockResolvedValue({
			id: 'vote-1',
			sessionId: 'session-1',
			taskId: 'task-1',
			userId: 'user-1',
			storyPoints: 5,
			user: {
				id: 'user-1',
				name: 'Ada',
				email: 'ada@example.com'
			}
		} as never);

		await caller.vote({ sessionId: 'session-1', storyPoints: 5 });

		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-planning-poker-session-1',
			'vote',
			{
				sessionId: 'session-1',
				taskId: 'task-1',
				userId: 'user-1',
				storyPoints: 5
			}
		);
	});

	it('updates the current task description and broadcasts it to the room', async () => {
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1'],
			currentTaskIndex: 0,
			createdById: 'user-1'
		} as never);
		mockDb.project.findUnique.mockResolvedValue({ canceledAt: null } as never);
		mockDb.task.update.mockResolvedValue({
			id: 'task-1',
			description: 'Clarified story description'
		} as never);

		const result = await caller.updateTaskDescription({
			sessionId: 'session-1',
			taskId: 'task-1',
			description: '  Clarified story description  '
		});

		expect(result).toEqual({
			id: 'task-1',
			description: 'Clarified story description',
			projectId: 'project-1'
		});
		expect(mockDb.task.update).toHaveBeenCalledWith({
			where: { id: 'task-1' },
			data: { description: 'Clarified story description' },
			select: { id: true, description: true }
		});
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-planning-poker-session-1',
			'task-description-updated',
			{
				sessionId: 'session-1',
				taskId: 'task-1',
				description: 'Clarified story description',
				projectId: 'project-1'
			}
		);

		mockDb.task.update.mockResolvedValue({
			id: 'task-1',
			description: null
		} as never);
		const cleared = await caller.updateTaskDescription({
			sessionId: 'session-1',
			taskId: 'task-1',
			description: '   '
		});

		expect(cleared.description).toBeNull();
		expect(mockDb.task.update).toHaveBeenLastCalledWith({
			where: { id: 'task-1' },
			data: { description: null },
			select: { id: true, description: true }
		});
	});

	it('deletes the current task, advances the session, and broadcasts it', async () => {
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1', 'task-2'],
			currentTaskIndex: 0,
			createdById: 'user-1'
		} as never);
		mockDb.project.findUnique.mockResolvedValue({ canceledAt: null } as never);
		mockDb.task.findUnique.mockResolvedValue({
			projectId: 'project-1',
			storyPoints: 5,
			sprint: null
		} as never);
		mockDb.taskAttachment.findMany.mockResolvedValue([] as never);
		mockDb.planningPokerSession.update.mockResolvedValue({
			taskIds: ['task-2'],
			currentTaskIndex: 0,
			status: 'ACTIVE'
		} as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);

		const result = await caller.deleteTask({
			sessionId: 'session-1',
			taskId: 'task-1'
		});

		expect(result).toEqual({
			session: {
				taskIds: ['task-2'],
				currentTaskIndex: 0,
				status: 'ACTIVE'
			},
			isSessionComplete: false,
			nextTaskIndex: 0,
			projectId: 'project-1'
		});
		expect(mockDb.planningPokerSession.update).toHaveBeenCalledWith({
			where: { id: 'session-1' },
			data: {
				taskIds: ['task-2'],
				currentTaskIndex: 0,
				status: 'ACTIVE'
			},
			select: {
				taskIds: true,
				currentTaskIndex: true,
				status: true
			}
		});
		expect(mockDb.task.delete).toHaveBeenCalledWith({
			where: { id: 'task-1' }
		});
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-planning-poker-session-1',
			'task-deleted',
			{
				sessionId: 'session-1',
				taskId: 'task-1',
				nextTaskIndex: 0,
				projectId: 'project-1'
			}
		);
	});

	it('completes the session when its last task is deleted', async () => {
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1'],
			currentTaskIndex: 0,
			createdById: 'user-1'
		} as never);
		mockDb.project.findUnique.mockResolvedValue({ canceledAt: null } as never);
		mockDb.task.findUnique.mockResolvedValue({
			projectId: 'project-1',
			storyPoints: null,
			sprint: null
		} as never);
		mockDb.taskAttachment.findMany.mockResolvedValue([] as never);
		mockDb.planningPokerSession.update.mockResolvedValue({
			taskIds: [],
			currentTaskIndex: 0,
			status: 'COMPLETED'
		} as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);

		const result = await caller.deleteTask({
			sessionId: 'session-1',
			taskId: 'task-1'
		});

		expect(result.isSessionComplete).toBe(true);
		expect(result.nextTaskIndex).toBeNull();
		expect(result.session.status).toBe('COMPLETED');
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-planning-poker-session-1',
			'task-deleted',
			expect.objectContaining({ nextTaskIndex: null })
		);
	});

	it('rejects task deletion from an admin who did not create the session', async () => {
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1'],
			currentTaskIndex: 0,
			createdById: 'another-admin'
		} as never);

		await expect(
			caller.deleteTask({ sessionId: 'session-1', taskId: 'task-1' })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
		expect(mockDb.task.findUnique).not.toHaveBeenCalled();
	});

	it('rejects edits for a task other than the current story', async () => {
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1', 'task-2'],
			currentTaskIndex: 0,
			createdById: 'user-1'
		} as never);
		mockDb.project.findUnique.mockResolvedValue({ canceledAt: null } as never);

		await expect(
			caller.updateTaskDescription({
				sessionId: 'session-1',
				taskId: 'task-2',
				description: 'Not current'
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.task.update).not.toHaveBeenCalled();
	});

	it('rejects edits from an admin who did not create the session', async () => {
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE',
			taskIds: ['task-1'],
			currentTaskIndex: 0,
			createdById: 'another-admin'
		} as never);

		await expect(
			caller.updateTaskDescription({
				sessionId: 'session-1',
				taskId: 'task-1',
				description: 'Not allowed'
			})
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
		expect(mockDb.task.update).not.toHaveBeenCalled();
	});
});
