'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '~/common/components/ui/dialog';
import { useDialog } from '~/common/hooks/useDialog';
import type { EpicsOutput } from '~/features/epics/types/Epic.type';
import type { SprintsApiOutput } from '~/features/sprints/types/Sprint.type';
import { CreateTaskForm } from './CreateTaskForm';

export interface CreateTaskDialogProps {
	epics?: EpicsOutput;
	sprints?: SprintsApiOutput;
	projectId: string;
	trigger?: React.ReactNode;
}

export function CreateTaskDialog({
	epics = [],
	sprints = [],
	projectId,
	trigger
}: CreateTaskDialogProps) {
	const { isDialogOpen, closeDialog } = useDialog('task');

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Create New Task</DialogTitle>
				</DialogHeader>

				<CreateTaskForm
					epics={epics}
					sprints={sprints}
					projectId={projectId}
					onSuccess={closeDialog}
				/>
			</DialogContent>
		</Dialog>
	);
}
