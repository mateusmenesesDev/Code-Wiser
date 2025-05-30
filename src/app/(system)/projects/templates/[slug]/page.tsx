'use client';

import { useState } from 'react';
import { Card, CardContent } from '~/common/components/ui/card';
import { ProjectHeader } from '~/features/projects/components/ProjectHeader';
import { ProjectStats } from '~/features/projects/components/ProjectStats';
import { ProjectTabs } from '~/features/projects/components/ProjectTabs';
import { api } from '~/trpc/react';

export default function ProjectPage({
	params: { slug }
}: { params: { slug: string } }) {
	const [activeTab, setActiveTab] = useState('overview');

	const { data: project, isLoading } = api.projectTemplate.getBySlug.useQuery({
		slug
	});

	if (isLoading) return <div>Loading...</div>;

	if (!project) return <div>Project not found</div>;

	return (
		<div className="mx-auto bg-background py-8 text-foreground">
			<div className="px-4">
				<Card className="mb-8">
					<ProjectHeader title={project.title} className="border-none" />
					<CardContent>
						<ProjectStats
							category={project.category.name}
							difficulty={project.difficulty}
							participants={project.minParticipants}
							maxParticipants={project.maxParticipants}
							credits={project.credits ?? 0}
						/>
					</CardContent>
				</Card>

				<ProjectTabs
					project={project}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
			</div>
		</div>
	);
}
