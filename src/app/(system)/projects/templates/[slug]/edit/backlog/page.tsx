'use client';

import { BacklogView } from '~/features/projects/components/backlog/BacklogView';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function BacklogPage() {
	const project = mockProject;

	return <BacklogView project={project} isTemplatePage />;
}
