import { TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { Check, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { api } from '~/trpc/react';

type TaskSubtask = {
	id: string;
	title: string;
	status: TaskStatusEnum | null;
};

interface TaskSubtasksProps {
	parentTaskId: string;
	projectId: string;
	isTemplate: boolean;
	subtasks?: TaskSubtask[];
}

export function TaskSubtasks({
	parentTaskId,
	projectId,
	isTemplate,
	subtasks = []
}: TaskSubtasksProps) {
	const [title, setTitle] = useState('');
	const utils = api.useUtils();
	const createSubtask = api.task.create.useMutation({
		onSuccess: async () => {
			setTitle('');
			await Promise.all([
				utils.task.getById.invalidate({ id: parentTaskId }),
				utils.kanban.getKanbanData.invalidate({ projectId })
			]);
		},
		onError: (error) => toast.error(error.message || 'Failed to create subtask')
	});

	const create = () => {
		const trimmedTitle = title.trim();
		if (!trimmedTitle || createSubtask.isPending) return;

		createSubtask.mutate({
			projectId,
			isTemplate,
			title: trimmedTitle,
			type: TaskTypeEnum.SUBTASK,
			parentTaskId,
			status: TaskStatusEnum.BACKLOG,
			tags: []
		});
	};

	const completedCount = subtasks.filter(
		(subtask) => subtask.status === TaskStatusEnum.DONE
	).length;

	return (
		<div
			className="space-y-2 border-border/60 border-t pt-2"
			onClick={(event) => event.stopPropagation()}
			onKeyDown={(event) => event.stopPropagation()}
			onPointerDown={(event) => event.stopPropagation()}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className="font-medium text-muted-foreground text-xs">
						Subtasks
					</span>
					<Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
						{completedCount}/{subtasks.length}
					</Badge>
				</div>
			</div>

			{subtasks.length > 0 && (
				<ul className="space-y-1" aria-label="Subtasks">
					{subtasks.map((subtask) => (
						<li
							key={subtask.id}
							className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs"
						>
							{subtask.status === TaskStatusEnum.DONE ? (
								<Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
							) : (
								<span className="h-3.5 w-3.5 shrink-0 rounded-full border" />
							)}
							<span className="truncate">{subtask.title}</span>
						</li>
					))}
				</ul>
			)}

			<div className="flex items-center gap-1.5">
				<Input
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							create();
						}
					}}
					placeholder="Add a subtask"
					aria-label="New subtask title"
					disabled={createSubtask.isPending}
					className="h-8 text-xs"
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-8 w-8 shrink-0"
					onClick={create}
					disabled={!title.trim() || createSubtask.isPending}
					aria-label="Add subtask"
				>
					{createSubtask.isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Plus className="h-3.5 w-3.5" />
					)}
				</Button>
			</div>
		</div>
	);
}
