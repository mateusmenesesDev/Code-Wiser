'use client';

import { KanbanBoard } from '~/features/projects/components/board/KanbanBoard';
import { ScrumBoard } from '~/features/projects/components/board/ScrumBoard';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function BoardPage() {
	const project = mockProject;

	return project.methodology === 'kanban' ? (
		<KanbanBoard project={project} />
	) : (
		<ScrumBoard project={project} />
	);
}
