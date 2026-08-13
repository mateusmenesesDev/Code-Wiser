import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum
} from '@prisma/client';
import { useMemo } from 'react';
import { api } from '~/trpc/react';
import type {
	ApprovedProjectsApiOutput,
	UserProjectApiResponse
} from '../types/Projects.type';
import { useProjectFilter } from './useProjectFilter';

export function useProject({
	initialProjectsData,
	initialUserProjectsData
}: {
	initialProjectsData?: ApprovedProjectsApiOutput;
	initialUserProjectsData?: UserProjectApiResponse[];
}) {
	const {
		searchTerm,
		categoryFilter,
		difficultyFilter,
		costFilter,
		technologiesFilter,
		methodologyFilter,
		sortFilter
	} = useProjectFilter();

	const catalogInput = useMemo(() => {
		const difficulty = Object.values(ProjectDifficultyEnum).find(
			(value) => value === difficultyFilter
		);
		const methodology = Object.values(ProjectMethodologyEnum).find(
			(value) => value === methodologyFilter
		);
		const sort = ['relevance', 'newest', 'difficulty'].find(
			(value) => value === sortFilter
		) as 'relevance' | 'newest' | 'difficulty' | undefined;

		const search = searchTerm.trim().slice(0, 100);

		return {
			search: search || undefined,
			category: categoryFilter === 'all' ? undefined : categoryFilter,
			technologies:
				technologiesFilter.length > 0 ? technologiesFilter : undefined,
			difficulty,
			methodology,
			accessType:
				costFilter === 'Free'
					? ProjectAccessTypeEnum.FREE
					: costFilter === 'Credits'
						? ProjectAccessTypeEnum.CREDITS
						: costFilter === 'Mentorship'
							? ProjectAccessTypeEnum.MENTORSHIP
							: undefined,
			sort: sort ?? 'relevance'
		};
	}, [
		categoryFilter,
		costFilter,
		difficultyFilter,
		methodologyFilter,
		searchTerm,
		sortFilter,
		technologiesFilter
	]);

	const hasCatalogFilters =
		Boolean(catalogInput.search) ||
		Boolean(catalogInput.category) ||
		Boolean(catalogInput.technologies) ||
		Boolean(catalogInput.difficulty) ||
		Boolean(catalogInput.methodology) ||
		Boolean(catalogInput.accessType) ||
		catalogInput.sort !== 'relevance';

	const projectsQuery = api.projectTemplate.getApproved.useQuery(catalogInput, {
		initialData: hasCatalogFilters ? undefined : initialProjectsData,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchInterval: false
	});
	const filterOptionsQuery = api.projectTemplate.getFilterOptions.useQuery(
		undefined,
		{
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false
		}
	);
	const userProjectsQuery = api.project.getEnrolled.useQuery(undefined, {
		initialData: initialUserProjectsData || undefined,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchInterval: false
	});

	return {
		userProjects: userProjectsQuery.data,
		filteredProjects: projectsQuery.data ?? [],
		filterOptions: filterOptionsQuery.data,
		isError: projectsQuery.isError || filterOptionsQuery.isError,
		retry: () =>
			Promise.all([projectsQuery.refetch(), filterOptionsQuery.refetch()]),
		isLoading: projectsQuery.isLoading || userProjectsQuery.isLoading
	};
}
