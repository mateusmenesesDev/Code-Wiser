import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { appRouter } from '~/server/api/root';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';

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

const deleteFilesMock = vi.fn().mockResolvedValue({ success: true });

vi.mock('uploadthing/server', () => ({
	UTApi: class {
		deleteFiles = deleteFilesMock;
	}
}));

describe('task.delete attachment storage cleanup', () => {
	const createCaller = createCallerFactory(appRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		deleteFilesMock.mockClear();
		const ctx = await createTRPCContext({
			headers: new Headers()
		});
		caller = createCaller(ctx);
	});

	it('deletes UploadThing files after the task (and cascaded attachment rows) are removed', async () => {
		mockDb.task.findUnique.mockResolvedValue({
			id: 'task-1',
			projectId: 'project-1',
			projectTemplateId: null,
			project: {
				members: [{ id: 'user-1' }]
			}
		} as never);
		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'user-1' }]
		} as never);
		mockDb.taskAttachment.findMany.mockResolvedValue([
			{ key: 'key-a' },
			{ key: 'key-b' }
		] as never);
		mockDb.task.delete.mockResolvedValue({ id: 'task-1' } as never);
		mockDb.notification.deleteMany.mockResolvedValue({ count: 0 } as never);

		await caller.task.delete({ taskId: 'task-1' });

		expect(mockDb.taskAttachment.findMany).toHaveBeenCalledWith({
			where: { taskId: 'task-1' },
			select: { key: true }
		});
		expect(mockDb.task.delete).toHaveBeenCalledWith({
			where: { id: 'task-1' }
		});
		expect(deleteFilesMock).toHaveBeenCalledWith(['key-a', 'key-b']);

		const findManyOrder =
			mockDb.taskAttachment.findMany.mock.invocationCallOrder[0];
		const deleteOrder = mockDb.task.delete.mock.invocationCallOrder[0];
		const utOrder = deleteFilesMock.mock.invocationCallOrder[0];
		expect(findManyOrder).toBeDefined();
		expect(deleteOrder).toBeDefined();
		expect(utOrder).toBeDefined();
		expect(Number(findManyOrder)).toBeLessThan(Number(deleteOrder));
		expect(Number(deleteOrder)).toBeLessThan(Number(utOrder));
	});

	it('still deletes the task when UploadThing cleanup fails', async () => {
		deleteFilesMock.mockRejectedValueOnce(new Error('UT unavailable'));
		mockDb.task.findUnique.mockResolvedValue({
			id: 'task-1',
			projectId: 'project-1',
			projectTemplateId: null,
			project: {
				members: [{ id: 'user-1' }]
			}
		} as never);
		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'user-1' }]
		} as never);
		mockDb.taskAttachment.findMany.mockResolvedValue([
			{ key: 'key-a' }
		] as never);
		mockDb.task.delete.mockResolvedValue({ id: 'task-1' } as never);
		mockDb.notification.deleteMany.mockResolvedValue({ count: 0 } as never);

		await expect(
			caller.task.delete({ taskId: 'task-1' })
		).resolves.toBeUndefined();

		expect(mockDb.task.delete).toHaveBeenCalled();
		expect(deleteFilesMock).toHaveBeenCalledWith(['key-a']);
	});
});
