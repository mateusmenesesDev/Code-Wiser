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
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useSprintQueries } from '~/features/sprints/hooks/useSprintQueries';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { api } from '~/trpc/react';
import { useTask } from '../../hooks/useTask';
import type {
	CreateTaskInput,
	TasksApiOutput,
	UpdateTaskInput
} from '../../types/Task.type';
import { DraggableTaskRow } from './DraggableTaskRow';

/**
 * Backlog Component
 *
 * Displays tasks in a table format with drag-and-drop reordering capabilities.
 * Features:
 * - Drag and drop to reorder tasks
 * - Optimistic updates for immediate UI feedback
 * - Inline editing of task properties (priority, epic, sprint, tags)
 * - Task creation and deletion
 *
 * The order column shows the current position of each task in the backlog.
 * Tasks can be reordered by dragging them to different positions.
 */
export default function Backlog({ projectId }: { projectId: string }) {
	const { id } = useParams();
	const { openDialog } = useDialog('task');
	const isTemplate = useIsTemplate();
	const [selectedTask, setSelectedTask] = useState<
		NonNullable<TasksApiOutput>[number] | null
	>(null);

	const { getAllSprints } = useSprintQueries();
	const { createTask, updateTask, updateTaskOrders, getAllTasksByProjectId } =
		useTask({ projectId });

	const [sprints] = getAllSprints();

	const [tasks] = getAllTasksByProjectId(projectId);

	const [projectData] = isTemplate
		? api.projectTemplate.getById.useSuspenseQuery({ id: projectId })
		: api.project.getById.useSuspenseQuery({ id: projectId });

	const handleTaskSubmit = useCallback(
		async (data: CreateTaskInput | UpdateTaskInput) => {
			if ('id' in data && data.id) {
				updateTask(data as UpdateTaskInput);
			} else {
				createTask({
					...data,
					status: TaskStatusEnum.BACKLOG
				} as CreateTaskInput);
			}
			setSelectedTask(null);
		},
		[createTask, updateTask]
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

	const moveTask = useCallback(
		(dragIndex: number, hoverIndex: number) => {
			if (dragIndex === hoverIndex) return;

			const backlogTasks = tasks
				?.filter((task) => task.status === TaskStatusEnum.BACKLOG)
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

			if (!backlogTasks || backlogTasks.length === 0) return;

			const updates = backlogTasks.map((task, index) => ({
				id: task.id,
				order:
					index === dragIndex
						? hoverIndex
						: index === hoverIndex
							? dragIndex
							: index
			}));

			updateTaskOrders(updates);
		},
		[tasks, updateTaskOrders]
	);

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
							<TableHead className="w-12">Order</TableHead>
							<TableHead>Title</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Epic</TableHead>
							<TableHead>Sprint</TableHead>
							<TableHead>Tags</TableHead>
							<TableHead className="w-16">Actions</TableHead>
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
								epics={
									projectData?.epics?.map((epic) => ({
										id: epic.id,
										title: epic.title
									})) || []
								}
							/>
						))}
					</TableBody>
				</Table>

				<TaskDialog
					task={selectedTask || undefined}
					projectId={isTemplate ? undefined : (id as string)}
					projectTemplateId={isTemplate ? (id as string) : undefined}
					epics={projectData?.epics || []}
					sprints={sprints}
					onSubmit={handleTaskSubmit}
				/>
			</div>
		</DndProvider>
	);
}
