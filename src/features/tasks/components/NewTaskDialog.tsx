'use client';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import NewTaskForm from './NewTaskForm';

interface NewTaskDialogProps {
	isOpen: boolean;
	onClose: () => void;
	projectTemplateName: string;
}

export function NewTaskDialog({
	isOpen,
	onClose,
	projectTemplateName
}: NewTaskDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Task</DialogTitle>
					<DialogDescription>
						Create a new task for your project. Fill in the details below.
					</DialogDescription>
				</DialogHeader>
				<NewTaskForm projectTemplateName={projectTemplateName} />
			</DialogContent>
		</Dialog>
	);
}
