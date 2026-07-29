import { toast } from 'sonner';
import { MAX_TASK_ATTACHMENTS } from '~/features/task/schemas/taskAttachment.schema';
import { api } from '~/trpc/react';

interface UseTaskAttachmentsProps {
	taskId: string;
	enabled?: boolean;
}

export function useTaskAttachments({
	taskId,
	enabled = true
}: UseTaskAttachmentsProps) {
	const utils = api.useUtils();

	const invalidate = () => {
		void utils.task.attachments.getByTaskId.invalidate({ taskId });
	};

	const { data: attachments = [], isLoading } =
		api.task.attachments.getByTaskId.useQuery(
			{ taskId },
			{ enabled: enabled && Boolean(taskId) }
		);

	const createMutation = api.task.attachments.create.useMutation({
		onSuccess: () => {
			toast.success('Attachment uploaded');
			invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to save attachment');
		}
	});

	const renameMutation = api.task.attachments.rename.useMutation({
		onMutate: async (variables) => {
			await utils.task.attachments.getByTaskId.cancel({ taskId });
			const previous = utils.task.attachments.getByTaskId.getData({ taskId });
			utils.task.attachments.getByTaskId.setData({ taskId }, (old) =>
				old?.map((attachment) =>
					attachment.id === variables.id
						? { ...attachment, displayName: variables.displayName }
						: attachment
				)
			);
			return { previous };
		},
		onError: (error, _variables, context) => {
			if (context?.previous) {
				utils.task.attachments.getByTaskId.setData(
					{ taskId },
					context.previous
				);
			}
			toast.error(error.message || 'Failed to rename attachment');
		},
		onSettled: invalidate,
		onSuccess: () => {
			toast.success('Attachment renamed');
		}
	});

	const replaceMutation = api.task.attachments.replace.useMutation({
		onSuccess: () => {
			toast.success('Attachment replaced');
			invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to replace attachment');
		}
	});

	const deleteMutation = api.task.attachments.delete.useMutation({
		onMutate: async (variables) => {
			await utils.task.attachments.getByTaskId.cancel({ taskId });
			const previous = utils.task.attachments.getByTaskId.getData({ taskId });
			utils.task.attachments.getByTaskId.setData({ taskId }, (old) =>
				old?.filter((attachment) => attachment.id !== variables.id)
			);
			return { previous };
		},
		onError: (error, _variables, context) => {
			if (context?.previous) {
				utils.task.attachments.getByTaskId.setData(
					{ taskId },
					context.previous
				);
			}
			toast.error(error.message || 'Failed to delete attachment');
		},
		onSettled: invalidate,
		onSuccess: () => {
			toast.success('Attachment deleted');
		}
	});

	const remainingSlots = Math.max(0, MAX_TASK_ATTACHMENTS - attachments.length);
	const canUpload = remainingSlots > 0;

	return {
		attachments,
		isLoading,
		createMutation,
		renameMutation,
		replaceMutation,
		deleteMutation,
		remainingSlots,
		canUpload,
		maxAttachments: MAX_TASK_ATTACHMENTS
	};
}
