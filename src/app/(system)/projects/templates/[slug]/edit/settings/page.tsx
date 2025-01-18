'use client';

import { ProjectSettings } from '~/features/projectManagement/components/settings/ProjectSettings';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function SettingsPage() {
	const project = mockProject;

	return <ProjectSettings project={project} />;
}
