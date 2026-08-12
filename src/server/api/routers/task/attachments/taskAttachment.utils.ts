import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';
import {
	MAX_TASK_ATTACHMENT_SIZE_BYTES,
	getFileExtension,
	isAllowedAttachmentExtension
} from '~/features/task/schemas/taskAttachment.schema';
import {
	type ResourceAccessContext,
	assertTaskAccess
} from '~/server/utils/auth';

export async function assertCanAccessTaskAttachments(
	ctx: ResourceAccessContext,
	taskId: string
) {
	return assertTaskAccess(ctx, taskId);
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
