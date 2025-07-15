'use client';

import { useEffect, useMemo } from 'react';
import { api } from '~/trpc/react';
import { useSetAllTasks } from '../../hooks/useTaskFiltersUrl';
import { TaskFilters } from '../TaskFilters';
import { TaskFiltersSkeleton } from '../TaskFiltersSkeleton';
import { KanbanBoardContent } from './KanbanBoardContent';
import { KanbanBoardSkeleton } from './KanbanBoardSkeleton';

interface KanbanBoardProps {
	projectId: string;
	isTemplate?: boolean;
}

export function KanbanBoard({
	projectId,
	isTemplate = false
}: KanbanBoardProps) {
	const { data: projectData, isLoading } = api.project.getById.useQuery({
		id: projectId
	});

	const setAllTasks = useSetAllTasks();

	const allTasks = useMemo(() => {
		return projectData?.tasks || [];
	}, [projectData?.tasks]);

	useEffect(() => {
		setAllTasks(allTasks);
	}, [allTasks, setAllTasks]);

	if (isLoading || !projectData) {
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
			<KanbanBoardContent projectId={projectId} isTemplate={isTemplate} />
		</div>
	);
}
