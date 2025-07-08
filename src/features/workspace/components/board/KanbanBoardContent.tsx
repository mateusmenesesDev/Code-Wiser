'use client';

import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { z } from 'zod';
import type { SprintApiOutput } from '~/features/sprints/types/Sprint.type';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { useComments } from '~/features/workspace/hooks/useComments';
import { useTask } from '~/features/workspace/hooks/useTask';
import type {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import type {
	CreateTaskInput,
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
		NonNullable<SprintApiOutput>['tasks'][number] | null
	>(null);

	// Get project data for epics and sprints
	const { data: projectData } = api.project.getById.useQuery({
		id: projectId
	});

	// Task mutations
	const { createTask, updateTask } = useTask({ projectId });

	// Comments hook - only when we have a selected task
	const { comments, addComment, isAddingComment } = useComments({
		taskId: selectedTask?.id || ''
	});

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
				await updateTask(data as UpdateTaskInput);
			} else {
				// Create new task - cast to CreateTaskInput
				await createTask(data as CreateTaskInput);
			}
			// Clear selected task after successful submission
			setSelectedTask(null);
		},
		[createTask, updateTask]
	);

	const handleTaskClick = useCallback(
		(task: NonNullable<SprintApiOutput>['tasks'][number]) => {
			setSelectedTask(task);
		},
		[]
	);

	const handleCreateTask = useCallback(() => {
		setSelectedTask(null); // Clear selected task to create new one
	}, []);

	const handleAddComment = useCallback(
		async (content: string): Promise<void> => {
			if (selectedTask) {
				await addComment(content);
			}
		},
		[addComment, selectedTask]
	);

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

			{/* TaskDialog for both creating and editing tasks */}
			<TaskDialog
				task={selectedTask || undefined}
				projectId={projectId}
				comments={selectedTask ? comments : []}
				onAddComment={selectedTask ? handleAddComment : undefined}
				isAddingComment={selectedTask ? isAddingComment : false}
				epics={projectData?.epics || []}
				sprints={projectData?.sprints || []}
				onSubmit={handleTaskSubmit}
			/>
		</DndProvider>
	);
}
