'use client';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { useDialog } from '~/common/hooks/useDialog';
import NewTaskForm from './NewTaskForm';

interface NewTaskDialogProps {
	projectTemplateName: string;
}

export function NewTaskDialog({ projectTemplateName }: NewTaskDialogProps) {
	const { isDialogOpen, setIsDialogOpen } = useDialog();

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
