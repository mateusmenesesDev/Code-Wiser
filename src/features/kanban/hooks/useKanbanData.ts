import { api } from '~/trpc/react';

export const useKanbanData = (projectId: string) => {
	const { data: allTasks } = api.kanban.getKanbanData.useQuery({
		projectId
	});
	const { data: members } = api.project.getMembers.useQuery({
		projectId
	});
	const { data: sprints } = api.sprint.getAllByProjectId.useQuery({
		projectId,
		isTemplate: false
	});

	return {
		allTasks,
		members,
		sprints
	};
};
