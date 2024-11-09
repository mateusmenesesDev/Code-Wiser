'use client';

import { EpicManagement } from '~/features/projects/components/epic/EpicManagement';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function EpicsPage() {
	const project = mockProject;

	return <EpicManagement project={project} />;
}
