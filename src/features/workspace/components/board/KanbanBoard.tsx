'use client';

import { type Task, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Column } from '~/features/projects/types';
import { BoardColumn } from './BoardColumn';

export function KanbanBoard() {
	const [columns, setColumns] = useState<Column[]>([
		{
			id: '1',
			title: 'Ready to Develop',
			color: 'bg-muted/30',
			tasks: [
				{
					id: 'task-1',
					title: 'Set up development environment',
					description:
						'Install Node.js Postgres and Prisma. Configure development database with proper connections and sample data for testing.',
					status: TaskStatusEnum.BACKLOG,
					type: TaskTypeEnum.TASK,
					createdAt: new Date(),
					updatedAt: new Date(),
					tags: ['setup', 'development', 'environment'],
					priority: 'HIGHEST',
					dueDate: new Date(),
					blocked: false,
					blockedReason: null,
					storyPoints: 1,
					projectId: '1',
					sprintId: null,
					assigneeId: null,
					projectTemplateId: null,
					epicId: null
				},
				{
					id: 'task-2',
					title: 'Create user authentication',
					description: 'Implement user login and registration functionality',
					status: TaskStatusEnum.BACKLOG,
					type: TaskTypeEnum.TASK,
					createdAt: new Date(),
					updatedAt: new Date(),
					tags: ['auth', 'security'],
					priority: 'HIGH',
					dueDate: new Date(),
					blocked: false,
					blockedReason: null,
					storyPoints: 1,
					projectId: '1',
					sprintId: null,
					assigneeId: null,
					projectTemplateId: null,
					epicId: null
				},
				{
					id: 'task-3',
					title: 'Design database schema',
					description: 'Create the database structure for the application',
					status: TaskStatusEnum.BACKLOG,
					type: TaskTypeEnum.TASK,
					createdAt: new Date(),
					updatedAt: new Date(),
					tags: ['database', 'design'],
					priority: 'MEDIUM',
					dueDate: new Date(),
					blocked: false,
					blockedReason: null,
					storyPoints: 1,
					projectId: '1',
					sprintId: null,
					assigneeId: null,
					projectTemplateId: null,
					epicId: null
				},
				{
					id: 'task-4',
					title: 'Write unit tests',
					description: 'Create comprehensive test suite for the application',
					status: TaskStatusEnum.BACKLOG,
					type: TaskTypeEnum.TASK,
					createdAt: new Date(),
					updatedAt: new Date(),
					tags: ['testing', 'quality'],
					priority: 'LOW',
					dueDate: new Date(),
					blocked: false,
					blockedReason: null,
					storyPoints: 1,
					projectId: '1',
					sprintId: null,
					assigneeId: null,
					projectTemplateId: null,
					epicId: null
				},
				{
					id: 'task-5',
					title: 'Deploy to production',
					description:
						'Set up production environment and deploy the application',
					status: TaskStatusEnum.BACKLOG,
					type: TaskTypeEnum.TASK,
					createdAt: new Date(),
					updatedAt: new Date(),
					tags: ['deployment', 'production'],
					priority: 'LOWEST',
					dueDate: new Date(),
					blocked: false,
					blockedReason: null,
					storyPoints: 1,
					projectId: '1',
					sprintId: null,
					assigneeId: null,
					projectTemplateId: null,
					epicId: null
				}
			]
		},
		{
			id: '2',
			title: 'In Progress',
			color: 'bg-blue-100/50 dark:bg-blue-900/20',
			tasks: []
		},
		{
			id: '3',
			title: 'Code Review',
			color: 'bg-yellow-100/50 dark:bg-yellow-900/20',
			tasks: []
		},
		{
			id: '4',
			title: 'Done',
			color: 'bg-green-100/50 dark:bg-green-900/20',
			tasks: []
		}
	]);

	const moveTask = useCallback(
		(
			taskId: string,
			fromColumnId: string,
			toColumnId: string,
			toIndex: number
		) => {
			setColumns((prevColumns) => {
				const newColumns = [...prevColumns];

				// Find source and destination columns
				const sourceColumnIndex = newColumns.findIndex(
					(col) => col.id === fromColumnId
				);
				const destColumnIndex = newColumns.findIndex(
					(col) => col.id === toColumnId
				);

				if (sourceColumnIndex === -1 || destColumnIndex === -1) {
					return prevColumns;
				}

				// Find the task
				const sourceColumn = newColumns[sourceColumnIndex];
				if (!sourceColumn) {
					return prevColumns;
				}
				const taskIndex = sourceColumn.tasks.findIndex(
					(task) => task.id === taskId
				);

				if (taskIndex === -1) {
					return prevColumns;
				}

				const task = sourceColumn.tasks[taskIndex];

				// Remove task from source column
				newColumns[sourceColumnIndex] = {
					...sourceColumn,
					tasks: sourceColumn.tasks.filter((t) => t.id !== taskId)
				};

				// Add task to destination column
				const destColumn = newColumns[destColumnIndex];
				if (!destColumn) {
					return prevColumns;
				}
				const newTasks = [...destColumn.tasks];
				newTasks.splice(toIndex, 0, task as Task);

				newColumns[destColumnIndex] = {
					...destColumn,
					tasks: newTasks
				};

				return newColumns;
			});
		},
		[]
	);

	return (
		<div className="h-full">
			<DndProvider backend={HTML5Backend}>
				<div className="grid h-[calc(100vh-40rem)] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
					{columns.map((column) => (
						<BoardColumn key={column.id} column={column} moveTask={moveTask} />
					))}
				</div>
			</DndProvider>
		</div>
	);
}
