import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { commentRouter } from './comment';
import { epicRouter } from './epic/epic.router';
import { prReviewRouter } from './prReview/prReviewRouter';
import { sprintRouter } from './sprint/sprint.router';

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

describe('project resource access', () => {
	beforeEach(() => {
		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'other-user' }]
		} as never);
	});

	it('scopes sprint lookup by project membership', async () => {
		mockDb.sprint.findUnique.mockResolvedValue({
			id: 'sprint-1',
			projectId: 'project-1',
			projectTemplateId: null,
			tasks: []
		} as never);
		const caller = createCallerFactory(sprintRouter)(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getById({ id: 'sprint-1' })).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('scopes epic lookup by project membership', async () => {
		mockDb.epic.findUnique.mockResolvedValue({
			id: 'epic-1',
			projectId: 'project-1',
			projectTemplateId: null,
			tasks: []
		} as never);
		const caller = createCallerFactory(epicRouter)(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getById({ id: 'epic-1' })).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('scopes comments and reviews by the task project', async () => {
		mockDb.task.findUnique.mockResolvedValue({
			projectId: 'project-1',
			projectTemplateId: null,
			project: { members: [{ id: 'other-user' }] }
		} as never);

		const commentCaller = createCallerFactory(commentRouter)(
			await createTRPCContext({ headers: new Headers() })
		);
		await expect(
			commentCaller.getByTaskId({ taskId: 'task-1' })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });

		const reviewCaller = createCallerFactory(prReviewRouter)(
			await createTRPCContext({ headers: new Headers() })
		);
		await expect(
			reviewCaller.getByTaskId({ taskId: 'task-1' })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});
});
