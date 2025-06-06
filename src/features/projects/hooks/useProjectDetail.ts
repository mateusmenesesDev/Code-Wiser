import { api } from '~/trpc/react';

export function useProjectDetail(slug: string) {
	const projectQuery = api.projectTemplate.getInfoBySlug.useQuery({ slug });

	return {
		project: projectQuery.data,
		isLoading: projectQuery.isLoading
	};
}
