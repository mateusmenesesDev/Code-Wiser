import { TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import {
	Check,
	ListPlus,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { Input } from '~/common/components/ui/input';
import { api } from '~/trpc/react';
import { AssigneeAvatars } from './AssigneeAvatars';

type TaskSubtask = {
	id: string;
	title: string;
	status: TaskStatusEnum | null;
	assignees?: { id: string; name: string | null }[];
};

interface TaskSubtasksProps {
	parentTaskId: string;
	projectId: string;
	isTemplate: boolean;
	subtasks?: TaskSubtask[];
	emptyAction?: 'input' | 'menu';
	openSubtasks?: boolean;
	onOpenSubtask?: (subtaskId: string) => void;
}

export function TaskSubtasks({
	parentTaskId,
	projectId,
	isTemplate,
	subtasks = [],
	emptyAction = 'input',
	openSubtasks = false,
	onOpenSubtask
}: TaskSubtasksProps) {
	const [title, setTitle] = useState('');
	const [isAdding, setIsAdding] = useState(
		subtasks.length > 0 || emptyAction === 'input'
	);
	const [updatingSubtaskId, setUpdatingSubtaskId] = useState<string | null>(
		null
	);
	const [deletingSubtaskId, setDeletingSubtaskId] = useState<string | null>(
		null
	);
	const [subtaskToDelete, setSubtaskToDelete] =
		useState<TaskSubtask | null>(null);
	const [, setTaskId] = useQueryState('taskId');
	const utils = api.useUtils();
	const invalidateSubtasks = () =>
		Promise.all([
			utils.task.getById.invalidate({ id: parentTaskId }),
			utils.kanban.getKanbanData.invalidate({ projectId })
		]);
	const createSubtask = api.task.create.useMutation({
		onSuccess: async () => {
			setTitle('');
			await invalidateSubtasks();
		},
		onError: (error) => toast.error(error.message || 'Failed to create subtask')
	});
	const updateSubtask = api.task.update.useMutation({
		onSuccess: invalidateSubtasks,
		onError: (error) => toast.error(error.message || 'Failed to complete subtask')
	});
	const deleteSubtask = api.task.delete.useMutation({
		onSuccess: invalidateSubtasks,
		onError: (error) => toast.error(error.message || 'Failed to delete subtask')
	});

	useEffect(() => {
		if (subtasks.length > 0) {
			setIsAdding(true);
		} else if (emptyAction === 'menu') {
			setIsAdding(false);
		}
	}, [emptyAction, subtasks.length]);

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

	const complete = (subtaskId: string) => {
		if (updateSubtask.isPending) return;

		setUpdatingSubtaskId(subtaskId);
		updateSubtask.mutate(
			{
				id: subtaskId,
				isTemplate,
				status: TaskStatusEnum.DONE
			},
			{ onSettled: () => setUpdatingSubtaskId(null) }
		);
	};

	const openSubtask = (subtaskId: string) => {
		if (onOpenSubtask) {
			onOpenSubtask(subtaskId);
			return;
		}
		void setTaskId(subtaskId);
	};

	const deleteSelectedSubtask = () => {
		if (!subtaskToDelete || deleteSubtask.isPending) return;

		setDeletingSubtaskId(subtaskToDelete.id);
		deleteSubtask.mutate(
			{ taskId: subtaskToDelete.id },
			{
				onSettled: () => {
					setDeletingSubtaskId(null);
					setSubtaskToDelete(null);
				}
			}
		);
	};

	const completedCount = subtasks.filter(
		(subtask) => subtask.status === TaskStatusEnum.DONE
	).length;
	const showEmptyMenu =
		emptyAction === 'menu' && subtasks.length === 0 && !isAdding;

	if (showEmptyMenu) {
		return (
			<div
				className="pointer-events-none absolute top-0 right-0 z-10 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
				onPointerDown={(event) => event.stopPropagation()}
			>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-7 w-7 bg-background/80"
							aria-label="Task options"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44">
						<DropdownMenuItem onSelect={() => setIsAdding(true)}>
							<ListPlus className="mr-2 h-4 w-4" />
							Create subtask
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	}

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
					{subtasks.map((subtask) => {
						const isComplete = subtask.status === TaskStatusEnum.DONE;
						const isUpdating = updatingSubtaskId === subtask.id;
						const isDeleting = deletingSubtaskId === subtask.id;

						return (
							<li
								key={subtask.id}
								className="group flex min-w-0 items-center gap-2 text-muted-foreground text-xs"
							>
								<button
									type="button"
									className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors hover:border-primary disabled:cursor-default disabled:opacity-70"
									disabled={
										isComplete || updateSubtask.isPending || deleteSubtask.isPending
									}
									onClick={() => complete(subtask.id)}
									aria-label={
										isComplete ? 'Subtask completed' : 'Complete subtask'
									}
								>
									{isUpdating ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										isComplete && <Check className="h-3.5 w-3.5" />
									)}
								</button>
								{openSubtasks ? (
									<button
										type="button"
										className="min-w-0 flex-1 truncate text-left hover:text-foreground"
										onClick={() => openSubtask(subtask.id)}
									>
										{subtask.title}
									</button>
								) : (
									<span className="min-w-0 flex-1 truncate">{subtask.title}</span>
								)}
								<AssigneeAvatars assignees={subtask.assignees} maxVisible={2} />
								<div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-5 w-5"
												disabled={isDeleting || deleteSubtask.isPending}
												aria-label={`Options for ${subtask.title}`}
											>
												{isDeleting ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<MoreHorizontal className="h-3.5 w-3.5" />
												)}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-36">
											<DropdownMenuItem
												className="text-destructive"
												disabled={deleteSubtask.isPending}
												onSelect={() => setSubtaskToDelete(subtask)}
											>
												<Trash2 className="mr-2 h-3.5 w-3.5" />
												Delete subtask
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{isAdding && (
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
			)}

			<ConfirmationDialog
				open={subtaskToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setSubtaskToDelete(null);
				}}
				title="Delete subtask?"
				description={`Delete "${subtaskToDelete?.title ?? ''}"? This action cannot be undone.`}
				confirmLabel="Delete"
				onConfirm={deleteSelectedSubtask}
			/>
		</div>
	);
}
