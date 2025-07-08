'use client';

import { Card, CardContent } from '~/common/components/ui/card';
import { ProjectHeader } from '~/features/projects/components/ProjectHeader';
import { api } from '~/trpc/react';

export default function ProjectPage({
	params: { id }
}: { params: { id: string } }) {
	const { data: project, isLoading } = api.projectTemplate.getById.useQuery({
		id
	});

	if (isLoading) return <div>Loading...</div>;

	if (!project) return <div>Project not found</div>;

	return (
		<div className="mx-auto bg-background py-8 text-foreground">
			<div className="px-4">
				<Card className="mb-8">
					<ProjectHeader title={project.title} className="border-none" />
					<CardContent>Soon...</CardContent>
				</Card>
			</div>
		</div>
	);
}
