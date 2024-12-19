'use client';

import { useParams } from 'next/navigation';
import { SprintPlanning } from '~/features/projects/components/sprint/SprintPlanning';
import { api } from '~/trpc/react';

export default function SprintsPage() {
	const params = useParams();
	const sprints = api.sprint.getSprints.useQuery({
		projectSlug: params.slug as string
	});

	if (!sprints.data) return null;

	return <SprintPlanning sprints={sprints.data} />;
}
