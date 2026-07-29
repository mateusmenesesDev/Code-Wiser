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

describe('task.attachments', () => {
	const createCaller = createCallerFactory(appRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		deleteFilesMock.mockClear();
		const ctx = await createTRPCContext({
			headers: new Headers()
		});
		caller = createCaller(ctx);
	});

	const memberTask = {
		id: 'task-1',
		projectId: 'project-1',
		projectTemplateId: null,
		project: {
			members: [{ id: 'user-1' }]
		}
	};

	it('creates an attachment when the user is a project member', async () => {
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		mockDb.taskAttachment.count.mockResolvedValue(0);
		const created = {
			id: 'att-1',
			createdAt: new Date(),
			updatedAt: new Date(),
			taskId: 'task-1',
			uploaderId: 'user-1',
			url: 'https://utfs.io/f/abc',
			key: 'abc',
			originalFileName: 'palette.md',
			displayName: 'palette.md',
			contentType: 'text/markdown',
			sizeBytes: 1200,
			uploader: { id: 'user-1', name: 'Mateus', email: 'm@example.com' }
		};
		mockDb.taskAttachment.create.mockResolvedValue(created as never);

		const result = await caller.task.attachments.create({
			taskId: 'task-1',
			url: 'https://utfs.io/f/abc',
			key: 'abc',
			originalFileName: 'palette.md',
			displayName: 'palette.md',
			contentType: 'text/markdown',
			sizeBytes: 1200
		});

		expect(result).toMatchObject({
			id: 'att-1',
			taskId: 'task-1',
			key: 'abc',
			displayName: 'palette.md'
		});
		expect(mockDb.taskAttachment.create).toHaveBeenCalled();
	});

	it('rejects create when the task already has 5 attachments', async () => {
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		mockDb.taskAttachment.count.mockResolvedValue(5);

		await expect(
			caller.task.attachments.create({
				taskId: 'task-1',
				url: 'https://utfs.io/f/abc',
				key: 'abc',
				originalFileName: 'palette.md',
				displayName: 'palette.md',
				contentType: 'text/markdown',
				sizeBytes: 1200
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: expect.stringMatching(/5/i)
		});

		expect(deleteFilesMock).toHaveBeenCalledWith('abc');
		expect(mockDb.taskAttachment.create).not.toHaveBeenCalled();
	});

	it('rejects disallowed file extensions', async () => {
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		mockDb.taskAttachment.count.mockResolvedValue(0);

		await expect(
			caller.task.attachments.create({
				taskId: 'task-1',
				url: 'https://utfs.io/f/abc',
				key: 'abc',
				originalFileName: 'malware.exe',
				displayName: 'malware.exe',
				contentType: 'application/octet-stream',
				sizeBytes: 1200
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		});

		expect(deleteFilesMock).toHaveBeenCalledWith('abc');
	});

	it('rejects create for non-members', async () => {
		mockDb.task.findUnique.mockResolvedValue({
			...memberTask,
			project: { members: [{ id: 'other-user' }] }
		} as never);

		await expect(
			caller.task.attachments.create({
				taskId: 'task-1',
				url: 'https://utfs.io/f/abc',
				key: 'abc',
				originalFileName: 'palette.md',
				displayName: 'palette.md',
				contentType: 'text/markdown',
				sizeBytes: 1200
			})
		).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('lists attachments ordered by createdAt ascending', async () => {
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		const attachments = [
			{
				id: 'att-1',
				createdAt: new Date('2026-01-01'),
				uploader: { id: 'user-1', name: 'Mateus', email: 'm@example.com' }
			},
			{
				id: 'att-2',
				createdAt: new Date('2026-01-02'),
				uploader: { id: 'user-1', name: 'Mateus', email: 'm@example.com' }
			}
		];
		mockDb.taskAttachment.findMany.mockResolvedValue(attachments as never);

		const result = await caller.task.attachments.getByTaskId({
			taskId: 'task-1'
		});

		expect(result).toHaveLength(2);
		expect(mockDb.taskAttachment.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { taskId: 'task-1' },
				orderBy: { createdAt: 'asc' }
			})
		);
	});

	it('deletes an attachment and removes the UploadThing file', async () => {
		mockDb.taskAttachment.findUnique.mockResolvedValue({
			id: 'att-1',
			key: 'abc',
			taskId: 'task-1',
			task: memberTask
		} as never);
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		mockDb.taskAttachment.delete.mockResolvedValue({ id: 'att-1' } as never);

		const result = await caller.task.attachments.delete({ id: 'att-1' });

		expect(result).toEqual({ success: true });
		expect(deleteFilesMock).toHaveBeenCalledWith('abc');
		expect(mockDb.taskAttachment.delete).toHaveBeenCalledWith({
			where: { id: 'att-1' }
		});
	});

	it('allows attachments on template tasks for authenticated users', async () => {
		const templateTask = {
			id: 'task-tpl',
			projectId: null,
			projectTemplateId: 'tpl-1',
			project: null
		};
		mockDb.task.findUnique.mockResolvedValue(templateTask as never);
		mockDb.taskAttachment.count.mockResolvedValue(0);
		mockDb.taskAttachment.create.mockResolvedValue({
			id: 'att-tpl',
			taskId: 'task-tpl',
			key: 'tpl-key',
			uploader: { id: 'user-1', name: 'Mateus', email: 'm@example.com' }
		} as never);

		const result = await caller.task.attachments.create({
			taskId: 'task-tpl',
			url: 'https://utfs.io/f/tpl-key',
			key: 'tpl-key',
			originalFileName: 'notes.pdf',
			displayName: 'notes.pdf',
			contentType: 'application/pdf',
			sizeBytes: 4000
		});

		expect(result.id).toBe('att-tpl');
	});

	it('renames only the display name without changing storage fields', async () => {
		mockDb.taskAttachment.findUnique.mockResolvedValue({
			id: 'att-1',
			taskId: 'task-1',
			key: 'abc',
			url: 'https://utfs.io/f/abc',
			displayName: 'palette.md'
		} as never);
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		mockDb.taskAttachment.update.mockResolvedValue({
			id: 'att-1',
			key: 'abc',
			url: 'https://utfs.io/f/abc',
			displayName: 'CSS palette',
			uploader: { id: 'user-1', name: 'Mateus', email: 'm@example.com' }
		} as never);

		const result = await caller.task.attachments.rename({
			id: 'att-1',
			displayName: 'CSS palette'
		});

		expect(result.displayName).toBe('CSS palette');
		expect(mockDb.taskAttachment.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'att-1' },
				data: { displayName: 'CSS palette' }
			})
		);
		expect(deleteFilesMock).not.toHaveBeenCalled();
	});

	it('replaces file metadata and deletes the previous UploadThing object', async () => {
		mockDb.taskAttachment.findUnique.mockResolvedValue({
			id: 'att-1',
			taskId: 'task-1',
			key: 'old-key',
			url: 'https://utfs.io/f/old-key',
			displayName: 'palette.md'
		} as never);
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);
		mockDb.taskAttachment.update.mockResolvedValue({
			id: 'att-1',
			key: 'new-key',
			url: 'https://utfs.io/f/new-key',
			originalFileName: 'palette-v2.md',
			displayName: 'palette-v2.md',
			contentType: 'text/markdown',
			sizeBytes: 2000,
			uploader: { id: 'user-1', name: 'Mateus', email: 'm@example.com' }
		} as never);

		const result = await caller.task.attachments.replace({
			id: 'att-1',
			url: 'https://utfs.io/f/new-key',
			key: 'new-key',
			originalFileName: 'palette-v2.md',
			displayName: 'palette-v2.md',
			contentType: 'text/markdown',
			sizeBytes: 2000
		});

		expect(result.key).toBe('new-key');
		expect(mockDb.taskAttachment.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'att-1' },
				data: expect.objectContaining({
					key: 'new-key',
					url: 'https://utfs.io/f/new-key',
					originalFileName: 'palette-v2.md'
				})
			})
		);
		expect(deleteFilesMock).toHaveBeenCalledWith('old-key');
	});

	it('rejects invalid replace files and deletes the newly uploaded blob', async () => {
		mockDb.taskAttachment.findUnique.mockResolvedValue({
			id: 'att-1',
			taskId: 'task-1',
			key: 'old-key',
			url: 'https://utfs.io/f/old-key'
		} as never);
		mockDb.task.findUnique.mockResolvedValue(memberTask as never);

		await expect(
			caller.task.attachments.replace({
				id: 'att-1',
				url: 'https://utfs.io/f/new-key',
				key: 'new-key',
				originalFileName: 'malware.exe',
				displayName: 'malware.exe',
				contentType: 'application/octet-stream',
				sizeBytes: 1000
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		});

		expect(deleteFilesMock).toHaveBeenCalledWith('new-key');
		expect(mockDb.taskAttachment.update).not.toHaveBeenCalled();
	});
});
