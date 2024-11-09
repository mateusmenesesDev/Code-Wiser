'use client';

import { SprintPlanning } from '~/features/projects/components/sprint/SprintPlanning';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function SprintsPage() {
	const project = mockProject;

	return <SprintPlanning project={project} />;
}
