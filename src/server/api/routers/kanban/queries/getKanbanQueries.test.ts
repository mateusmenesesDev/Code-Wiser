import { ProjectRoleEnum, TaskStatusEnum } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { kanbanRouter } from '../index';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('kanban.getKanbanData', () => {
	const createCaller = createCallerFactory(kanbanRouter);

	beforeEach(() => {
		mockDb.project.findUnique.mockResolvedValue({
			memberships: [
				{ userId: 'user-1', role: ProjectRoleEnum.MENTOR, status: 'ACTIVE' }
			]
		} as never);
		mockDb.task.findMany.mockResolvedValue([
			{
				id: 'task-1',
				productVersionId: 'version-1'
			}
		] as never);
	});

	it('excludes backlog tasks from the default board query', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.getKanbanData({ projectId: 'project-1' });
		const args = mockDb.task.findMany.mock.calls[0]?.[0] as {
			where: { status?: { not?: TaskStatusEnum } };
		};

		expect(args.where.status).toEqual({ not: TaskStatusEnum.BACKLOG });
	});

	it('can include backlog tasks for a planning board', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.getKanbanData({
			projectId: 'project-1',
			includeBacklog: true
		});
		const args = mockDb.task.findMany.mock.calls[0]?.[0] as {
			where: { status?: unknown };
		};

		expect(args.where.status).toBeUndefined();
	});

	it('returns product version ids so version filters can match tasks', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		const tasks = await caller.getKanbanData({ projectId: 'project-1' });
		const args = mockDb.task.findMany.mock.calls[0]?.[0] as {
			select: Record<string, unknown>;
		};

		expect(args.select.productVersionId).toBe(true);
		expect(tasks[0]).toMatchObject({ productVersionId: 'version-1' });
	});
});
