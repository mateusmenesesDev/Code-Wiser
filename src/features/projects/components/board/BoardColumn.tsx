'use client';

import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader } from '~/common/components/card';
import { ScrollArea } from '~/common/components/scroll-area';
import type { Column } from '../../types';
import { TaskCard } from '../task/TaskCard';
import { ColumnHeader } from './ColumnHeader';

interface BoardColumnProps {
	column: Column;
	onAddTask?: () => void;
}

export function BoardColumn({ column, onAddTask }: BoardColumnProps) {
	return (
		<Card>
			<CardHeader>
				<ColumnHeader
					title={column.title}
					count={column.tasks.length}
					onAddTask={onAddTask}
				/>
			</CardHeader>
			<CardContent>
				<Droppable droppableId={column.id}>
					{(provided) => (
						<ScrollArea
							className="h-[400px]"
							{...provided.droppableProps}
							ref={provided.innerRef}
						>
							{column.tasks.map((task, index) => (
								<Draggable key={task.id} draggableId={task.id} index={index}>
									{(provided) => (
										<div
											ref={provided.innerRef}
											{...provided.draggableProps}
											{...provided.dragHandleProps}
										>
											<TaskCard task={task} />
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</ScrollArea>
					)}
				</Droppable>
			</CardContent>
		</Card>
	);
}
