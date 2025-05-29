'use client';

import { useKanbanData } from '../../hooks/useKanbanData';
import { KanbanBoardContent } from './KanbanBoardContent';
import { KanbanBoardSkeleton } from './KanbanBoardSkeleton';

interface KanbanBoardProps {
	projectSlug: string;
}

export function KanbanBoard({ projectSlug }: KanbanBoardProps) {
	const { columns, isLoading, moveTask } = useKanbanData(projectSlug);

	if (isLoading || !columns) {
		return <KanbanBoardSkeleton />;
	}

	return <KanbanBoardContent columns={columns} moveTask={moveTask} />;
}
