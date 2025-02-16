'use client';

import { useParams } from 'next/navigation';
import { SprintPlanning } from '~/features/projectManagement/components/sprint/SprintPlanning';
import { api } from '~/trpc/react';

export default function SprintsPage() {
	const params = useParams();
	const sprints = api.projectTemplate.sprint.getAllSprints.useQuery({
		projectTemplateSlug: params.slug as string
	});

	console.log(sprints.data);

	if (!sprints.data) return null;

	return <SprintPlanning sprints={sprints.data} />;
}
