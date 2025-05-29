'use client';

import { useMemo } from 'react';
import { useFilteredColumnsUrl } from '../../hooks/useFilteredColumnsUrl';
import { useKanbanData } from '../../hooks/useKanbanData';
import { useSetAllTasks } from '../../hooks/useTaskFiltersUrl';
import { TaskFilters } from '../TaskFilters';
import { TaskFiltersSkeleton } from '../TaskFiltersSkeleton';
import { KanbanBoardContent } from './KanbanBoardContent';
import { KanbanBoardSkeleton } from './KanbanBoardSkeleton';

interface KanbanBoardProps {
	projectSlug: string;
}

export function KanbanBoard({ projectSlug }: KanbanBoardProps) {
	const { columns, isLoading, moveTask } = useKanbanData(projectSlug);
	const setAllTasks = useSetAllTasks();
	const filteredColumns = useFilteredColumnsUrl(columns);

	const allTasks = useMemo(() => {
		return columns?.flatMap((column) => column.tasks) || [];
	}, [columns]);

	useMemo(() => {
		setAllTasks(allTasks);
	}, [allTasks, setAllTasks]);

	if (isLoading || !columns) {
		return (
			<div className="space-y-6">
				<TaskFiltersSkeleton />
				<KanbanBoardSkeleton />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<TaskFilters />
			<KanbanBoardContent
				columns={filteredColumns || columns}
				moveTask={moveTask}
			/>
		</div>
	);
}
