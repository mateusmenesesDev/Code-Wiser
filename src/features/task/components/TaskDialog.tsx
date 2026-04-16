import { useCallback, useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { TaskComments } from './TaskComments';
import { TaskDialogContent } from './TaskDialogContent';

interface TaskDialogProps {
	taskId?: string;
	projectId: string;
	onClose: () => void;
}

export function TaskDialog({ taskId, projectId, onClose }: TaskDialogProps) {
	const isOpen = taskId !== undefined;
	const actualTaskId = taskId === 'new' ? undefined : taskId;

	const [isDirty, setIsDirty] = useState(false);
	const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

	const guardedClose = useCallback(() => {
		if (isDirty) {
			setConfirmDiscardOpen(true);
		} else {
			onClose();
		}
	}, [isDirty, onClose]);

	const handleDiscard = useCallback(() => {
		setConfirmDiscardOpen(false);
		onClose();
	}, [onClose]);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && guardedClose()}>
				<DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="pr-8 font-semibold text-xl">
							{actualTaskId ? 'Edit Task' : 'Create Task'}
						</DialogTitle>
					</DialogHeader>

					<TaskDialogContent
						taskId={actualTaskId}
						projectId={projectId}
						onClose={guardedClose}
						onDirtyChange={setIsDirty}
					/>

					<div
						className="pointer-events-none absolute opacity-0"
						aria-hidden="true"
					>
						<TaskComments taskId={actualTaskId} isEditing={true} />
					</div>
				</DialogContent>
			</Dialog>

			<ConfirmationDialog
				open={confirmDiscardOpen}
				onOpenChange={setConfirmDiscardOpen}
				title="Discard unsaved changes?"
				description="You have unsaved changes that will be lost. Are you sure you want to close?"
				confirmLabel="Discard"
				cancelLabel="Keep editing"
				onConfirm={handleDiscard}
				onCancel={() => setConfirmDiscardOpen(false)}
			/>
		</>
	);
}
