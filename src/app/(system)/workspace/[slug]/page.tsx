'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ProjectHeader } from '~/features/workspace/components/ProjectHeader';
import { ProjectHeaderSkeleton } from '~/features/workspace/components/ProjectHeaderSkeleton';
import { ProjectStatsCards } from '~/features/workspace/components/ProjectStatsCards';
import { ProjectStatsCardsSkeleton } from '~/features/workspace/components/ProjectStatsCardsSkeleton';
import { WorkspaceTabs } from '~/features/workspace/components/WorkspaceTabs';
import { useKanbanData } from '~/features/workspace/hooks/useKanbanData';
import { useProjectData } from '~/features/workspace/hooks/useProjectData';
import { useProjectStats } from '~/features/workspace/hooks/useProjectStats';

export default function ProjectPage() {
	const params = useParams();
	const projectSlug = params.slug as string;
	const [activeTab, setActiveTab] = useState('board');

	// Get project and kanban data
	const { project, isLoading: isProjectLoading } = useProjectData(projectSlug);
	const { columns, isLoading: isKanbanLoading } = useKanbanData(projectSlug);
	const stats = useProjectStats(columns);

	return (
		<div>
			{/* Show skeleton header while project data is loading */}
			{isProjectLoading ? (
				<ProjectHeaderSkeleton />
			) : (
				<ProjectHeader projectTitle={project?.title} />
			)}

			{/* Show skeleton stats while kanban data is loading */}
			{isKanbanLoading ? (
				<ProjectStatsCardsSkeleton />
			) : (
				<ProjectStatsCards stats={stats} />
			)}

			<WorkspaceTabs
				projectSlug={projectSlug}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
		</div>
	);
}
