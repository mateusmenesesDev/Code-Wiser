import type { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectTemplateRouter } from '../projectTemplate';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'admin-user-id',
		sessionClaims: { o: { rol: 'admin' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: ({ role }: { role: string }) => role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('projectTemplate.reorder', () => {
	const createCaller = createCallerFactory(projectTemplateRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		mockDb.$transaction.mockImplementation(async (ops) => {
			if (typeof ops === 'function') {
				return ops(mockDb);
			}
			return Promise.all(ops);
		});

		caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
	});

	it('updates sortOrder for each template', async () => {
		mockDb.projectTemplate.findMany.mockResolvedValue([
			{ id: 'tpl-1' },
			{ id: 'tpl-2' }
		] as never);
		mockDb.projectTemplate.update.mockResolvedValue({} as never);

		await caller.reorder({
			items: [
				{ id: 'tpl-2', sortOrder: 0 },
				{ id: 'tpl-1', sortOrder: 1 }
			]
		});

		expect(mockDb.projectTemplate.findMany).toHaveBeenCalledWith({
			where: {
				id: { in: ['tpl-2', 'tpl-1'] }
			},
			select: { id: true }
		});
		expect(mockDb.projectTemplate.update).toHaveBeenCalledWith({
			where: { id: 'tpl-2' },
			data: { sortOrder: 0 }
		});
		expect(mockDb.projectTemplate.update).toHaveBeenCalledWith({
			where: { id: 'tpl-1' },
			data: { sortOrder: 1 }
		});
	});

	it('rejects when a template is missing', async () => {
		mockDb.projectTemplate.findMany.mockResolvedValue([
			{ id: 'tpl-1' }
		] as never);

		await expect(
			caller.reorder({
				items: [
					{ id: 'tpl-1', sortOrder: 0 },
					{ id: 'tpl-missing', sortOrder: 1 }
				]
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		} satisfies Partial<TRPCError>);

		expect(mockDb.projectTemplate.update).not.toHaveBeenCalled();
	});
});
