import { api } from '~/trpc/react';

export function useProjectDetail(id: string) {
	const projectQuery = api.projectTemplate.getInfoById.useQuery({ id });

	return {
		project: projectQuery.data,
		isLoading: projectQuery.isLoading
	};
}
