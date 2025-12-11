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

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8 font-semibold text-xl">
						{actualTaskId ? 'Edit Task' : 'Create Task'}
					</DialogTitle>
				</DialogHeader>

				<TaskDialogContent
					taskId={actualTaskId}
					projectId={projectId}
					onClose={onClose}
				/>

				<div
					className="pointer-events-none absolute opacity-0"
					aria-hidden="true"
				>
					<TaskComments taskId={actualTaskId} isEditing={true} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
