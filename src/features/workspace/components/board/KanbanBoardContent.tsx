'use client';

import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { z } from 'zod';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { useTask } from '~/features/workspace/hooks/useTask';
import type {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import type {
	CreateTaskInput,
	TasksApiOutput,
	UpdateTaskInput
} from '~/features/workspace/types/Task.type';
import { api } from '~/trpc/react';
import type { Column } from '../../../projects/types';
import { useKanbanData } from '../../hooks/useKanbanData';
import { useTaskFiltersUrl } from '../../hooks/useTaskFiltersUrl';
import { BoardColumn } from './BoardColumn';

interface KanbanBoardContentProps {
	projectId: string;
	isTemplate?: boolean;
}

export function KanbanBoardContent({ projectId }: KanbanBoardContentProps) {
	const { filters } = useTaskFiltersUrl();
	const { columns, moveTask, isLoading } = useKanbanData(projectId, filters);
	const [selectedTask, setSelectedTask] = useState<
		NonNullable<TasksApiOutput>[number] | null
	>(null);

	const { data: projectData } = api.project.getById.useQuery({
		id: projectId
	});

	const { createTask, updateTask } = useTask({ projectId });

	const transformedColumns: Column[] = columns.map((column) => ({
		id: column.id,
		title: column.title,
		tasks: column.tasks,
		color: column.color,
		bgClass: column.bgClass,
		borderClass: column.borderClass
	}));

	const handleTaskSubmit = useCallback(
		async (
			data: z.infer<typeof createTaskSchema> | z.infer<typeof updateTaskSchema>
		) => {
			if ('id' in data && data.id) {
				// Update existing task - cast to UpdateTaskInput
				updateTask(data as UpdateTaskInput);
			} else {
				// Create new task - cast to CreateTaskInput
				createTask(data as CreateTaskInput);
			}
			// Clear selected task after successful submission
			setSelectedTask(null);
		},
		[createTask, updateTask]
	);

	const handleTaskClick = useCallback(
		(task: NonNullable<TasksApiOutput>[number]) => {
			setSelectedTask(task);
		},
		[]
	);

	const handleCreateTask = useCallback(() => {
		setSelectedTask(null); // Clear selected task to create new one
	}, []);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="grid h-[calc(100vh-40rem)] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
				{transformedColumns.map((column) => (
					<BoardColumn
						key={column.id}
						column={column}
						moveTask={moveTask}
						projectId={projectId}
						onTaskClick={handleTaskClick}
						onCreateTask={handleCreateTask}
					/>
				))}
			</div>

			<TaskDialog
				task={selectedTask || undefined}
				projectId={projectId}
				epics={projectData?.epics || []}
				sprints={projectData?.sprints || []}
				onSubmit={handleTaskSubmit}
			/>
		</DndProvider>
	);
}
