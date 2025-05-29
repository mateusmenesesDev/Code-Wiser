import { api } from '~/trpc/react';

export function useProjectData(projectSlug: string) {
	const {
		data: project,
		isLoading,
		error
	} = api.project.getBySlug.useQuery({
		slug: projectSlug
	});

	return {
		project,
		isLoading,
		error
	};
}
