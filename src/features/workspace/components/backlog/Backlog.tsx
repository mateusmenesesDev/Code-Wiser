'use client';

import { TaskStatusEnum } from '@prisma/client';
import { Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '~/common/components/ui/button';
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { useDialog } from '~/common/hooks/useDialog';
import { useSprintQueries } from '~/features/sprints/hooks/useSprintQueries';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { useComments } from '../../hooks/useComments';
import { useTask } from '../../hooks/useTask';
import type {
	CreateTaskInput,
	TasksApiOutput,
	UpdateTaskInput
} from '../../types/Task.type';
import { BacklogSkeleton } from './BacklogSkeleton';
import { DraggableTaskRow } from './DraggableTaskRow';

export default function Backlog({ projectId }: { projectId: string }) {
	const { id } = useParams();
	const { openDialog } = useDialog('task');
	const [selectedTask, setSelectedTask] = useState<
		NonNullable<TasksApiOutput>[number] | null
	>(null);

	const { getAllSprints } = useSprintQueries();
	const { createTask, updateTask, updateTaskOrders, getAllTasksByProjectId } =
		useTask({ projectId });

	const { data: sprints, isLoading: isSprintsLoading } = getAllSprints();
	const { data: tasks, isLoading: isTasksLoading } =
		getAllTasksByProjectId(projectId);

	const isLoading = isSprintsLoading || isTasksLoading;

	const { comments, addComment, isAddingComment } = useComments({
		taskId: selectedTask?.id || ''
	});

	const handleTaskSubmit = useCallback(
		async (data: CreateTaskInput | UpdateTaskInput) => {
			if ('id' in data && data.id) {
				updateTask(data as UpdateTaskInput);
			} else {
				createTask({
					...data,
					projectId: id as string,
					status: TaskStatusEnum.BACKLOG
				} as CreateTaskInput);
			}
			setSelectedTask(null);
		},
		[createTask, id, updateTask]
	);

	const handleCreateTask = useCallback(() => {
		setSelectedTask(null);
		openDialog('task');
	}, [openDialog]);

	const handleTaskClick = useCallback(
		(task: NonNullable<TasksApiOutput>[number]) => {
			setSelectedTask(task);
			openDialog('task');
		},
		[openDialog]
	);

	const handleAddComment = useCallback(
		async (content: string): Promise<void> => {
			if (selectedTask) {
				await addComment(content);
			}
		},
		[addComment, selectedTask]
	);

	const moveTask = useCallback(
		(dragIndex: number, hoverIndex: number) => {
			const backlogTasks = tasks
				?.filter((task) => task.status === TaskStatusEnum.BACKLOG)
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

			const updates = backlogTasks?.map((task, index) => ({
				id: task.id,
				order:
					index === dragIndex
						? hoverIndex
						: index === hoverIndex
							? dragIndex
							: index
			}));

			if (updates) {
				updateTaskOrders(updates);
			}
		},
		[tasks, updateTaskOrders]
	);

	if (isLoading) {
		return <BacklogSkeleton />;
	}

	const backlogTasks = tasks
		?.filter((task) => task.status === TaskStatusEnum.BACKLOG)
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl">Backlog</h2>
					<Button onClick={handleCreateTask}>
						<Plus className="h-4 w-4" />
						Add Task
					</Button>
				</div>

				<Table className="border">
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Epic</TableHead>
							<TableHead>Sprint</TableHead>
							<TableHead>Tags</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{backlogTasks?.map((task, index) => (
							<DraggableTaskRow
								key={task.id}
								task={task}
								index={index}
								projectId={id as string}
								onTaskClick={handleTaskClick}
								moveTask={moveTask}
								sprints={sprints}
							/>
						))}
					</TableBody>
				</Table>

				<TaskDialog
					task={selectedTask || undefined}
					projectId={id as string}
					comments={selectedTask ? comments : []}
					onAddComment={selectedTask ? handleAddComment : undefined}
					isAddingComment={selectedTask ? isAddingComment : false}
					sprints={sprints}
					onSubmit={handleTaskSubmit}
				/>
			</div>
		</DndProvider>
	);
}
