'use client';

import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { cn } from '~/lib/utils';
import type { Column } from '../../../projects/types';
import { TaskCard } from '../tasks/TaskCard';
import { ColumnHeader } from './ColumnHeader';

interface BoardColumnProps {
	column: Column;
	onAddTask?: () => void;
	moveTask: (
		taskId: string,
		fromColumnId: string,
		toColumnId: string,
		toIndex: number
	) => void;
}

// Drop zone component for insertion points
function DropZone({
	columnId,
	index,
	moveTask
}: {
	columnId: string;
	index: number;
	moveTask: (
		taskId: string,
		fromColumnId: string,
		toColumnId: string,
		toIndex: number
	) => void;
}) {
	const [{ isOver, canDrop }, drop] = useDrop({
		accept: 'TASK',
		drop: (item: { id: string; columnId: string }) => {
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

export function BoardColumn({ column, onAddTask, moveTask }: BoardColumnProps) {
	const ref = useRef<HTMLDivElement>(null);

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: 'TASK',
		drop: (item: { id: string; columnId: string }, monitor) => {
			if (!monitor.didDrop()) {
				// If dropped on the column but not on a specific drop zone, add to end
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
		<Card
			ref={ref}
			className={cn(
				'h-full border-0 bg-card/40 shadow-lg backdrop-blur-sm transition-all duration-200',
				isOver &&
					canDrop &&
					'border-2 border-primary/20 bg-primary/10 shadow-xl',
				canDrop && 'border-dashed'
			)}
		>
			<CardHeader
				className={cn(
					`${column.color} border-b backdrop-blur-sm transition-all duration-200`,
					isOver && canDrop && 'bg-primary/5'
				)}
			>
				<ColumnHeader
					title={column.title}
					count={column.tasks.length}
					onAddTask={onAddTask}
				/>
			</CardHeader>
			<CardContent className="h-full p-4">
				<div
					className={cn(
						'h-full min-h-[200px] transition-all duration-200',
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
			</CardContent>
		</Card>
	);
}
