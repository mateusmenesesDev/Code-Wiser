'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ProjectHeader } from '~/features/workspace/components/ProjectHeader';
import { ProjectHeaderSkeleton } from '~/features/workspace/components/ProjectHeaderSkeleton';
import { ProjectStatsCards } from '~/features/workspace/components/ProjectStatsCards';
import { ProjectStatsCardsSkeleton } from '~/features/workspace/components/ProjectStatsCardsSkeleton';
import WorkspaceAccessDenied from '~/features/workspace/components/WorkspaceAccessDenied';
import WorkspaceNotFound from '~/features/workspace/components/WorkspaceNotFound';
import { WorkspaceTabs } from '~/features/workspace/components/WorkspaceTabs';
import { useKanbanData } from '~/features/workspace/hooks/useKanbanData';
import { useProjectData } from '~/features/workspace/hooks/useProjectData';
import { calculateProjectStats } from '~/features/workspace/utils/kanbanColumns';

export default function ProjectPage() {
	const params = useParams();
	const projectId = params.id as string;
	const [activeTab, setActiveTab] = useState('board');

	const {
		project,
		isLoading: isProjectLoading,
		error
	} = useProjectData(projectId);
	const { columns, isLoading: isKanbanLoading } = useKanbanData(projectId);

	const stats = useMemo(() => {
		if (!columns)
			return {
				totalTasks: 0,
				completedTasks: 0,
				inProgressTasks: 0,
				progressPercentage: 0
			};
		return calculateProjectStats(columns);
	}, [columns]);

	if (error) {
		switch (error.data?.code) {
			case 'FORBIDDEN':
				return <WorkspaceAccessDenied />;
			case 'NOT_FOUND':
				return <WorkspaceNotFound />;
		}
	}

	return (
		<div>
			{isProjectLoading ? (
				<ProjectHeaderSkeleton />
			) : (
				<ProjectHeader
					projectTitle={project?.title}
					figmaProjectUrl={project?.figmaProjectUrl || undefined}
				/>
			)}

			<div className="mb-4">
				{isKanbanLoading ? (
					<ProjectStatsCardsSkeleton />
				) : (
					<ProjectStatsCards stats={stats} />
				)}
			</div>

			<WorkspaceTabs
				projectId={projectId}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
		</div>
	);
}
