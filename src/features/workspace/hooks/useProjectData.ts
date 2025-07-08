import { api } from '~/trpc/react';

export function useProjectData(projectId: string) {
	const {
		data: project,
		isLoading,
		error
	} = api.project.getById.useQuery({
		id: projectId
	});

	return {
		project,
		isLoading,
		error
	};
}
