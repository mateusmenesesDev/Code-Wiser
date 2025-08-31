'use client';

import type { TaskStatusEnum } from '@prisma/client';
import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import type { TasksApiOutput } from '~/features/workspace/types/Task.type';
import { cn } from '~/lib/utils';
import type { Column } from '../../../projects/types';
import { TaskCard } from '../tasks/TaskCard';
import { ColumnHeader } from './ColumnHeader';

interface BoardColumnProps {
	column: Column;
	projectId: string;
	onTaskClick: (task: NonNullable<TasksApiOutput>[number]) => void;
	onCreateTask: () => void;
	moveTask: (
		taskId: string,
		fromColumnId: TaskStatusEnum,
		toColumnId: TaskStatusEnum,
		toIndex: number
	) => void;
}

function DropZone({
	columnId,
	index,
	moveTask
}: {
	columnId: TaskStatusEnum;
	index: number;
	moveTask: (
		taskId: string,
		fromColumnId: TaskStatusEnum,
		toColumnId: TaskStatusEnum,
		toIndex: number
	) => void;
}) {
	const [{ isOver, canDrop }, drop] = useDrop({
		accept: 'TASK',
		drop: (item: { id: string; columnId: TaskStatusEnum }) => {
			moveTask(item.id, item.columnId, columnId, index);
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop()
		})
	});

	const ref = useRef<HTMLDivElement>(null);
	drop(ref);

	return (
		<div
			ref={ref}
			className={cn(
				'h-2 transition-all duration-200',
				isOver &&
					canDrop &&
					'h-8 rounded border-2 border-primary/40 border-dashed bg-primary/20'
			)}
		/>
	);
}

export function BoardColumn({
	column,
	moveTask,
	projectId,
	onTaskClick,
	onCreateTask
}: BoardColumnProps) {
	const ref = useRef<HTMLDivElement>(null);

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: 'TASK',
		drop: (item: { id: string; columnId: TaskStatusEnum }, monitor) => {
			if (!monitor.didDrop()) {
				const targetIndex = column.tasks.length;
				moveTask(item.id, item.columnId, column.id, targetIndex);
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop()
		})
	});

	drop(ref);

	return (
		<div
			ref={ref}
			className={cn(
				'border-0 bg-card/40 shadow-lg backdrop-blur-sm transition-all duration-200',
				isOver &&
					canDrop &&
					'border-2 border-primary/20 bg-primary/10 shadow-xl',
				canDrop && 'border-dashed'
			)}
		>
			<ColumnHeader
				title={column.title}
				count={column.tasks.length}
				onCreateTask={onCreateTask}
				className={cn(
					column.bgClass,
					column.borderClass,
					isOver && canDrop && 'bg-primary/5'
				)}
			/>
			<div className="h-[calc(100vh-30.375rem)] overflow-y-auto p-4">
				<div
					className={cn(
						'h-full transition-all duration-200',
						isOver && canDrop && 'rounded-lg bg-primary/5'
					)}
				>
					{/* Drop zone at the beginning */}
					<DropZone columnId={column.id} index={0} moveTask={moveTask} />

					{column.tasks.map((task, index) => (
						<div key={task.id}>
							<TaskCard
								task={task}
								columnId={column.id}
								index={index}
								projectId={projectId}
								onTaskClick={onTaskClick}
								moveTask={moveTask}
							/>
							{/* Drop zone after each task */}
							<DropZone
								columnId={column.id}
								index={index + 1}
								moveTask={moveTask}
							/>
						</div>
					))}

					{/* Empty state for when there are no tasks */}
					{column.tasks.length === 0 && (
						<div
							className={cn(
								'flex h-32 items-center justify-center rounded-lg border-2 border-muted-foreground/20 border-dashed transition-all duration-200',
								isOver && canDrop && 'border-primary/40 bg-primary/5'
							)}
						>
							<p className="text-muted-foreground text-sm">
								{isOver ? 'Drop task here' : 'No tasks'}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
