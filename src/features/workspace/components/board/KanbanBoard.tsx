'use client';

import { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { RouterOutputs } from '~/trpc/react';
import { api } from '~/trpc/react';
import { BoardColumn } from './BoardColumn';
import { KanbanColumnSkeleton } from './KanbanColumnSkeleton';

interface KanbanBoardProps {
	projectSlug: string;
}

type KanbanColumn = RouterOutputs['kanban']['getColumnsByProjectSlug'][number];

export function KanbanBoard({ projectSlug }: KanbanBoardProps) {
	const utils = api.useUtils();

	// Get kanban columns with tasks
	const { data: columns } = api.kanban.getColumnsByProjectSlug.useQuery({
		projectSlug: projectSlug
	});

	console.log('columns', columns);

	// Move task mutation with optimistic updates
	const moveTaskMutation = api.kanban.moveTask.useMutation({
		onMutate: async ({ taskId, fromColumnId, toColumnId, toIndex }) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await utils.kanban.getColumnsByProjectSlug.cancel({ projectSlug });

			// Snapshot the previous value
			const previousColumns = utils.kanban.getColumnsByProjectSlug.getData({
				projectSlug
			});

			if (!previousColumns) return { previousColumns };

			// Optimistically update the data
			const newColumns = [...previousColumns];

			// Find the task being moved
			let taskToMove: KanbanColumn['tasks'][number] | null = null;
			let fromColumnIndex = -1;
			let taskIndex = -1;

			for (let i = 0; i < newColumns.length; i++) {
				const column = newColumns[i];
				if (column?.id === fromColumnId) {
					fromColumnIndex = i;
					taskIndex = column.tasks.findIndex((task) => task.id === taskId);
					if (taskIndex !== -1) {
						taskToMove = column.tasks[taskIndex] ?? null;
						break;
					}
				}
			}

			if (!taskToMove || fromColumnIndex === -1 || taskIndex === -1) {
				return { previousColumns };
			}

			// Remove task from source column
			const sourceColumn = newColumns[fromColumnIndex];
			if (sourceColumn) {
				newColumns[fromColumnIndex] = {
					...sourceColumn,
					tasks: sourceColumn.tasks.filter((task) => task.id !== taskId)
				};
			}

			// Find target column and add task
			const toColumnIndex = newColumns.findIndex(
				(col) => col?.id === toColumnId
			);
			if (toColumnIndex !== -1) {
				const targetColumn = newColumns[toColumnIndex];
				if (targetColumn) {
					const newTasks = [...targetColumn.tasks];

					// Insert task at the specified index
					const insertIndex = Math.min(toIndex, newTasks.length);
					newTasks.splice(insertIndex, 0, {
						...taskToMove,
						kanbanColumnId: toColumnId,
						orderInColumn: insertIndex
					});

					// Update order for all tasks in the target column
					newTasks.forEach((task, index) => {
						task.orderInColumn = index;
					});

					newColumns[toColumnIndex] = {
						...targetColumn,
						tasks: newTasks
					};
				}
			}

			// Update the cache with optimistic data
			utils.kanban.getColumnsByProjectSlug.setData({ projectSlug }, newColumns);

			return { previousColumns };
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			console.error('Failed to move task:', error);

			if (context?.previousColumns) {
				utils.kanban.getColumnsByProjectSlug.setData(
					{ projectSlug },
					context.previousColumns
				);
			}
		},
		onSettled: () => {
			// Always refetch after error or success to ensure we have the latest data
			void utils.kanban.getColumnsByProjectSlug.invalidate({ projectSlug });
		}
	});

	const moveTask = useCallback(
		(
			taskId: string,
			fromColumnId: string,
			toColumnId: string,
			toIndex: number
		) => {
			moveTaskMutation.mutate({
				taskId,
				fromColumnId,
				toColumnId,
				toIndex
			});
		},
		[moveTaskMutation]
	);

	if (!columns) {
		return (
			<div className="h-full">
				<div className="grid h-[calc(100vh-40rem)] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
					{/* Skeleton columns with variety */}
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={2} />
					</div>
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={4} />
					</div>
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={1} />
					</div>
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={3} />
					</div>
				</div>
			</div>
		);
	}

	console.log('columns', columns);

	return (
		<div className="h-full">
			<DndProvider backend={HTML5Backend}>
				<div className="grid h-[calc(100vh-40rem)] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
					{columns.map((column: KanbanColumn) => (
						<BoardColumn
							key={column.id}
							column={{
								id: column.id,
								title: column.title,
								tasks: column.tasks,
								color: column.color || 'bg-muted/30'
							}}
							moveTask={moveTask}
						/>
					))}
				</div>
			</DndProvider>
		</div>
	);
}
