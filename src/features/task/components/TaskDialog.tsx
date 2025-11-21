import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { useDialog } from '~/common/hooks/useDialog';
import { TaskComments } from './TaskComments';
import { TaskDialogContent } from './TaskDialogContent';

interface TaskDialogProps {
	taskId?: string;
	projectId: string;
}

export function TaskDialog({ taskId, projectId }: TaskDialogProps) {
	const { isDialogOpen, closeDialog } = useDialog('task');

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			<DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8 font-semibold text-xl">
						{taskId ? 'Edit Task' : 'Create Task'}
					</DialogTitle>
				</DialogHeader>

				<TaskDialogContent taskId={taskId} projectId={projectId} />

				<div
					className="pointer-events-none absolute opacity-0"
					aria-hidden="true"
				>
					<TaskComments taskId={taskId} isEditing={true} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
