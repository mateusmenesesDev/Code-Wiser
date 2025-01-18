'use client';

import { KanbanBoard } from '~/features/projectManagement/components/board/KanbanBoard';
import { ScrumBoard } from '~/features/projectManagement/components/board/ScrumBoard';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function BoardPage() {
	const project = mockProject;

	return project.methodology === 'kanban' ? (
		<KanbanBoard project={project} />
	) : (
		<ScrumBoard project={project} />
	);
}
