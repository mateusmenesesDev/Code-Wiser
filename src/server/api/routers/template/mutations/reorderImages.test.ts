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

describe('projectTemplate.reorderImages', () => {
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

	it('updates order for each image belonging to the template', async () => {
		mockDb.projectImage.findMany.mockResolvedValue([
			{ id: 'img-1' },
			{ id: 'img-2' }
		] as never);
		mockDb.projectImage.update.mockResolvedValue({} as never);

		await caller.reorderImages({
			projectTemplateId: 'tpl-1',
			items: [
				{ id: 'img-2', order: 0 },
				{ id: 'img-1', order: 1 }
			]
		});

		expect(mockDb.projectImage.findMany).toHaveBeenCalledWith({
			where: {
				id: { in: ['img-2', 'img-1'] },
				projectTemplateId: 'tpl-1'
			},
			select: { id: true }
		});
		expect(mockDb.projectImage.update).toHaveBeenCalledWith({
			where: { id: 'img-2' },
			data: { order: 0 }
		});
		expect(mockDb.projectImage.update).toHaveBeenCalledWith({
			where: { id: 'img-1' },
			data: { order: 1 }
		});
	});

	it('rejects when an image does not belong to the template', async () => {
		mockDb.projectImage.findMany.mockResolvedValue([{ id: 'img-1' }] as never);

		await expect(
			caller.reorderImages({
				projectTemplateId: 'tpl-1',
				items: [
					{ id: 'img-1', order: 0 },
					{ id: 'img-foreign', order: 1 }
				]
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		} satisfies Partial<TRPCError>);

		expect(mockDb.projectImage.update).not.toHaveBeenCalled();
	});
});
