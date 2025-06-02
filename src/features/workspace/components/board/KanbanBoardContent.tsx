'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CreateTaskDialog } from '~/common/components/task/CreateTaskDialog';
import { api } from '~/trpc/react';
import type { Column } from '../../../projects/types';
import { useKanbanData } from '../../hooks/useKanbanData';
import { useTaskFiltersUrl } from '../../hooks/useTaskFiltersUrl';
import { BoardColumn } from './BoardColumn';

interface KanbanBoardContentProps {
	projectSlug: string;
	isTemplate?: boolean;
}

export function KanbanBoardContent({
	projectSlug,
	isTemplate = false
}: KanbanBoardContentProps) {
	const { filters } = useTaskFiltersUrl();
	const { columns, moveTask, isLoading } = useKanbanData(projectSlug, filters);

	const { data: epics = [] } = isTemplate
		? api.epic.getAllEpicsByProjectTemplateSlug.useQuery({
				projectTemplateSlug: projectSlug
			})
		: api.epic.getAllEpicsByProjectId.useQuery({
				projectId: projectSlug
			});

	const { data: sprints = [] } = isTemplate
		? api.sprint.getAllByProjectTemplateSlug.useQuery({
				projectTemplateSlug: projectSlug
			})
		: api.sprint.getAllByProjectSlug.useQuery({
				projectSlug: projectSlug
			});

	const transformedColumns: Column[] = columns.map((column) => ({
		id: column.id,
		title: column.title,
		tasks: column.tasks,
		color: column.color,
		bgClass: column.bgClass,
		borderClass: column.borderClass
	}));

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<>
			<DndProvider backend={HTML5Backend}>
				<div className="grid h-[calc(100vh-40rem)] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
					{transformedColumns.map((column) => (
						<BoardColumn key={column.id} column={column} moveTask={moveTask} />
					))}
				</div>
			</DndProvider>

			<CreateTaskDialog
				epics={epics}
				sprints={sprints}
				projectSlug={projectSlug}
			/>
		</>
	);
}
