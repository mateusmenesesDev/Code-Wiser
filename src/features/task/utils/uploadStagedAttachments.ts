import { toast } from 'sonner';
import { uploadFiles } from '~/common/utils/uploadthing';
import type { CreateTaskAttachmentInput } from '~/features/task/schemas/taskAttachment.schema';

type LinkAttachment = (input: CreateTaskAttachmentInput) => Promise<unknown>;

export type StagedUploadResult = {
	succeeded: string[];
	failed: { name: string; error: string }[];
};

export async function uploadAndLinkStagedAttachments(options: {
	taskId: string;
	files: File[];
	linkAttachment: LinkAttachment;
	onProgress?: (progress: number) => void;
}): Promise<StagedUploadResult> {
	const { taskId, files, linkAttachment, onProgress } = options;
	const succeeded: string[] = [];
	const failed: { name: string; error: string }[] = [];

	if (files.length === 0) {
		return { succeeded, failed };
	}

	for (let index = 0; index < files.length; index++) {
		const file = files[index];
		if (!file) continue;

		const baseProgress = (index / files.length) * 100;

		try {
			const [uploaded] = await uploadFiles('taskAttachment', {
				files: [file],
				onUploadProgress: ({ progress }) => {
					onProgress?.(baseProgress + progress / files.length);
				}
			});

			if (!uploaded) {
				failed.push({
					name: file.name,
					error: 'Upload returned no file'
				});
				continue;
			}

			await linkAttachment({
				taskId,
				url: uploaded.ufsUrl,
				key: uploaded.key,
				originalFileName: uploaded.name,
				displayName: uploaded.name,
				contentType: uploaded.type || 'application/octet-stream',
				sizeBytes: uploaded.size
			});

			succeeded.push(file.name);
		} catch (error) {
			failed.push({
				name: file.name,
				error: error instanceof Error ? error.message : 'Upload failed'
			});
		}

		onProgress?.(((index + 1) / files.length) * 100);
	}

	return { succeeded, failed };
}

export function reportStagedUploadResult(result: StagedUploadResult) {
	if (result.succeeded.length > 0 && result.failed.length === 0) {
		toast.success(
			result.succeeded.length === 1
				? 'Attachment uploaded'
				: `${result.succeeded.length} attachments uploaded`
		);
		return;
	}

	if (result.succeeded.length > 0) {
		toast.success(
			`${result.succeeded.length} attachment${result.succeeded.length === 1 ? '' : 's'} uploaded`
		);
	}

	for (const failure of result.failed) {
		toast.error(`${failure.name}: ${failure.error}`);
	}

	if (result.failed.length > 0) {
		toast.message('Open the task to retry failed attachments');
	}
}
