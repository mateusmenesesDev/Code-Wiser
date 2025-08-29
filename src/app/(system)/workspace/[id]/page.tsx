'use client';

import { AlertTriangle, Lock } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { ProjectHeader } from '~/features/workspace/components/ProjectHeader';
import { ProjectHeaderSkeleton } from '~/features/workspace/components/ProjectHeaderSkeleton';
import { ProjectStatsCards } from '~/features/workspace/components/ProjectStatsCards';
import { ProjectStatsCardsSkeleton } from '~/features/workspace/components/ProjectStatsCardsSkeleton';
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

	if (error?.data?.code === 'FORBIDDEN') {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="mx-auto max-w-md">
					<CardHeader className="text-center">
						<Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle>Access Denied</CardTitle>
						<CardDescription>
							You don't have permission to access this project workspace.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button variant="outline" onClick={() => window.history.back()}>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error?.data?.code === 'NOT_FOUND') {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="mx-auto max-w-md">
					<CardHeader className="text-center">
						<AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<CardTitle>Project Not Found</CardTitle>
						<CardDescription>
							The project you're looking for doesn't exist or has been removed.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button variant="outline" onClick={() => window.history.back()}>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
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

			{isKanbanLoading ? (
				<ProjectStatsCardsSkeleton />
			) : (
				<ProjectStatsCards stats={stats} />
			)}

			<WorkspaceTabs
				projectId={projectId}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
		</div>
	);
}
