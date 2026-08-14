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
	const { data: epics } = api.epic.getAllByProjectId.useQuery({
		projectId,
		isTemplate: false
	});
	const { data: productVersionData } = api.productVersion.getAll.useQuery({
		projectId,
		isTemplate: false
	});

	return {
		allTasks,
		members,
		sprints,
		epics,
		productVersions: productVersionData?.versions ?? []
	};
};
