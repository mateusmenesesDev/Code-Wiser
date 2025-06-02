'use client';

import { useMemo } from 'react';
import { api } from '~/trpc/react';
import { useSetAllTasks } from '../../hooks/useTaskFiltersUrl';
import { TaskFilters } from '../TaskFilters';
import { TaskFiltersSkeleton } from '../TaskFiltersSkeleton';
import { KanbanBoardContent } from './KanbanBoardContent';
import { KanbanBoardSkeleton } from './KanbanBoardSkeleton';

interface KanbanBoardProps {
	projectSlug: string;
	isTemplate?: boolean;
}

export function KanbanBoard({
	projectSlug,
	isTemplate = false
}: KanbanBoardProps) {
	// Get unfiltered data for setting up the task atom (for filter options)
	const { data: projectData, isLoading } = isTemplate
		? api.projectTemplate.getBySlug.useQuery({ slug: projectSlug })
		: api.project.getBySlug.useQuery({ slug: projectSlug });

	const setAllTasks = useSetAllTasks();

	const allTasks = useMemo(() => {
		return projectData?.tasks || [];
	}, [projectData?.tasks]);

	useMemo(() => {
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
			<KanbanBoardContent projectSlug={projectSlug} isTemplate={isTemplate} />
		</div>
	);
}
