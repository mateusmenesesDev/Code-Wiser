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
import type { SprintsOutput } from '~/features/workspace/types/Sprint.type';
import { CreateTaskForm } from './CreateTaskForm';

export interface CreateTaskDialogProps {
	epics?: EpicsOutput;
	sprints?: SprintsOutput;
	projectSlug: string;
	trigger?: React.ReactNode;
}

export function CreateTaskDialog({
	epics = [],
	sprints = [],
	projectSlug,
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
					projectSlug={projectSlug}
					onSuccess={closeDialog}
				/>
			</DialogContent>
		</Dialog>
	);
}
