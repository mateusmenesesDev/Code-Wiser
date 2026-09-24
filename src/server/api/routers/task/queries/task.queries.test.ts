import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { taskRouter } from '../taskRouter';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	}),
	clerkClient: {
		users: {
			getUser: vi.fn()
		}
	}
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('task.getById', () => {
	const createCaller = createCallerFactory(taskRouter);

	beforeEach(() => {
		mockDb.task.findUnique.mockResolvedValue({
			id: 'task-1',
			projectId: 'project-1',
			projectTemplateId: null,
			project: {
				memberships: [
					{
						userId: 'user-1',
						role: 'LEARNER',
						status: 'ACTIVE',
						joinedAt: new Date()
					}
				]
			},
			assignees: [],
			blockedByLinks: [],
			blockingLinks: [],
			sprint: null,
			epic: null
		} as never);
	});

	it('allows a project member to read a task', async () => {
		mockDb.project.findUnique.mockResolvedValue({
			memberships: [
				{
					userId: 'user-1',
					role: 'LEARNER',
					status: 'ACTIVE',
					joinedAt: new Date()
				}
			]
		} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getById({ id: 'task-1' })).resolves.toBeTruthy();
		const args = mockDb.task.findUnique.mock.calls.at(-1)?.[0] as {
			include: {
				parentTask?: { select?: { id?: boolean; title?: boolean } };
				subtasks?: {
					select?: {
						assignees?: { select?: { id?: boolean; name?: boolean } };
					};
				};
			};
		};
		expect(args.include.parentTask?.select).toEqual({
			id: true,
			title: true
		});
		expect(args.include.subtasks?.select?.assignees?.select).toEqual({
			id: true,
			name: true
		});
	});

	it('rejects a non-member even when the task id is known', async () => {
		mockDb.project.findUnique.mockResolvedValue({
			memberships: []
		} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getById({ id: 'task-1' })).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});
});
