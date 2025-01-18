'use client';

import { DragDropContext } from 'react-beautiful-dnd';
import type { Project } from '../../../projects/types';
import { BoardColumn } from './BoardColumn';

interface KanbanBoardProps {
	project: Project;
}

export function KanbanBoard({ project }: KanbanBoardProps) {
	return (
		<div className="h-full p-6">
			<DragDropContext onDragEnd={() => {}}>
				<div className="grid h-full auto-cols-[300px] grid-flow-col gap-4 overflow-x-auto">
					{project.columns.map((column) => (
						<BoardColumn key={column.id} column={column} />
					))}
				</div>
			</DragDropContext>
		</div>
	);
}
