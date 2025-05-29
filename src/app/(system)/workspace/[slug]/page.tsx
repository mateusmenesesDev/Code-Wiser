'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { DesignFileCard } from '~/features/workspace/components/DesignFileCard';
import { DesignFileCardSkeleton } from '~/features/workspace/components/DesignFileCardSkeleton';
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

	const { project, isLoading: isProjectLoading } = useProjectData(projectSlug);
	const { columns, isLoading: isKanbanLoading } = useKanbanData(projectSlug);
	const stats = useProjectStats(columns);

	return (
		<div>
			{isProjectLoading ? (
				<ProjectHeaderSkeleton />
			) : (
				<ProjectHeader projectTitle={project?.title} />
			)}

			{isKanbanLoading ? (
				<ProjectStatsCardsSkeleton />
			) : (
				<ProjectStatsCards stats={stats} />
			)}

			{isProjectLoading ? (
				<DesignFileCardSkeleton />
			) : (
				project?.figmaProjectUrl && (
					<DesignFileCard figmaProjectUrl={project.figmaProjectUrl} />
				)
			)}

			<WorkspaceTabs
				projectSlug={projectSlug}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
		</div>
	);
}
