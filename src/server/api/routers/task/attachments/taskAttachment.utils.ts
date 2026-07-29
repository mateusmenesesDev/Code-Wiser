import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';
import {
	MAX_TASK_ATTACHMENT_SIZE_BYTES,
	getFileExtension,
	isAllowedAttachmentExtension
} from '~/features/task/schemas/taskAttachment.schema';

type AccessContext = {
	db: PrismaClient;
	session: { userId: string };
	isAdmin: boolean;
};

export async function assertCanAccessTaskAttachments(
	ctx: AccessContext,
	taskId: string
) {
	const task = await ctx.db.task.findUnique({
		where: { id: taskId },
		include: {
			project: {
				include: {
					members: {
						select: { id: true }
					}
				}
			}
		}
	});

	if (!task) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Task not found'
		});
	}

	const hasAccess =
		ctx.isAdmin ||
		Boolean(task.projectTemplateId) ||
		Boolean(
			task.project?.members.some((member) => member.id === ctx.session.userId)
		);

	if (!hasAccess) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this task'
		});
	}

	return task;
}

export { getFileExtension };

export function assertAllowedAttachmentFile(input: {
	originalFileName: string;
	sizeBytes: number;
}) {
	if (input.sizeBytes > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'File must be 10MB or smaller'
		});
	}

	if (!isAllowedAttachmentExtension(input.originalFileName)) {
		const extension = getFileExtension(input.originalFileName);
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: `File type "${extension || 'unknown'}" is not allowed`
		});
	}
}

/** Best-effort UploadThing cleanup. Call after DB rows are already removed. */
export async function deleteUploadThingFiles(keys: string[]) {
	const uniqueKeys = [...new Set(keys.filter(Boolean))];
	if (uniqueKeys.length === 0) return;

	try {
		const utApi = new UTApi();
		await utApi.deleteFiles(uniqueKeys);
	} catch (error) {
		console.error('Failed to delete attachment files from UploadThing:', error);
	}
}
