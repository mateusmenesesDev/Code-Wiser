import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { RouterOutputs } from '~/trpc/react';
import { BoardColumn } from './BoardColumn';

type KanbanColumn = RouterOutputs['kanban']['getColumnsByProjectSlug'][number];

interface KanbanBoardContentProps {
	columns: KanbanColumn[];
	moveTask: (
		taskId: string,
		fromColumnId: string,
		toColumnId: string,
		toIndex: number
	) => void;
}

export function KanbanBoardContent({
	columns,
	moveTask
}: KanbanBoardContentProps) {
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
