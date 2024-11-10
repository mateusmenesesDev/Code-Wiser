'use client';

import { ProjectSettings } from '~/features/projects/components/settings/ProjectSettings';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function SettingsPage() {
	const project = mockProject;

	return <ProjectSettings project={project} />;
}
