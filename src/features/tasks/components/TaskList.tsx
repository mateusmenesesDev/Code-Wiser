'use client';

import {
	DragDropContext,
	Draggable,
	type DraggableProvided,
	type DropResult,
	Droppable,
	type DroppableProvided
} from 'react-beautiful-dnd';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import type { Task } from '../../projects/types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
	tasks?: Task[];
	onDragEnd?: (result: DropResult) => void;
}

export function TaskList({ tasks = [], onDragEnd = () => {} }: TaskListProps) {
	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable droppableId="task-list">
				{(provided: DroppableProvided) => (
					<ScrollArea
						className="h-[calc(100vh-12rem)]"
						{...provided.droppableProps}
						ref={provided.innerRef}
					>
						<div className="space-y-2 p-1">
							{tasks.map((task, index) => (
								<Draggable key={task.id} draggableId={task.id} index={index}>
									{(provided: DraggableProvided) => (
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
						</div>
					</ScrollArea>
				)}
			</Droppable>
		</DragDropContext>
	);
}
