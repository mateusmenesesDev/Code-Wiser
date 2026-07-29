import { z } from 'zod';

export const MAX_TASK_ATTACHMENTS = 5;
export const MAX_TASK_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_TASK_ATTACHMENT_EXTENSIONS = [
	'.md',
	'.pdf',
	'.doc',
	'.docx',
	'.png',
	'.jpg',
	'.jpeg',
	'.webp',
	'.gif'
] as const;

export const createTaskAttachmentSchema = z.object({
	taskId: z.string().min(1),
	url: z.string().url(),
	key: z.string().min(1),
	originalFileName: z.string().min(1),
	displayName: z.string().min(1),
	contentType: z.string().min(1),
	sizeBytes: z.number().int().positive().max(MAX_TASK_ATTACHMENT_SIZE_BYTES, {
		message: 'File must be 10MB or smaller'
	})
});

export const deleteTaskAttachmentSchema = z.object({
	id: z.string().min(1)
});

export const getTaskAttachmentsSchema = z.object({
	taskId: z.string().min(1)
});

export type CreateTaskAttachmentInput = z.infer<
	typeof createTaskAttachmentSchema
>;

export function getFileExtension(fileName: string): string {
	const lastDot = fileName.lastIndexOf('.');
	if (lastDot === -1) return '';
	return fileName.slice(lastDot).toLowerCase();
}

export function isAllowedAttachmentExtension(fileName: string): boolean {
	const extension = getFileExtension(fileName);
	return ALLOWED_TASK_ATTACHMENT_EXTENSIONS.includes(
		extension as (typeof ALLOWED_TASK_ATTACHMENT_EXTENSIONS)[number]
	);
}
