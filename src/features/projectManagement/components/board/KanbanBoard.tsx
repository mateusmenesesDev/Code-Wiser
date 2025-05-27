'use client';

import { DragDropContext } from 'react-beautiful-dnd';
import { BoardColumn } from './BoardColumn';

export function KanbanBoard() {
	const columns = [
		{
			id: '1',
			title: 'Backlog',
			tasks: []
		},
		{
			id: '2',
			title: 'In Progress',
			tasks: []
		},
		{
			id: '3',
			title: 'Done',
			tasks: []
		}
	];
	return (
		<div className="h-full p-6">
			<DragDropContext onDragEnd={() => {}}>
				<div className="grid h-full auto-cols-[300px] grid-flow-col gap-4 overflow-x-auto">
					{columns.map((column) => (
						<BoardColumn key={column.id} column={column} />
					))}
				</div>
			</DragDropContext>
		</div>
	);
}
