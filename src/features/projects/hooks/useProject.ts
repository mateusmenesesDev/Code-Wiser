import { api } from '~/trpc/react';

import { type FilterConfig, createFilter } from '../utils/filterUtils';

import { useMemo } from 'react';
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
		setSearchTerm,
		categoryFilter,
		setCategoryFilter,
		difficultyFilter,
		setDifficultyFilter,
		costFilter,
		setCostFilter
	} = useProjectFilter();

	const projectsQuery = api.projectTemplate.getApproved.useQuery(undefined, {
		initialData: initialProjectsData || undefined,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchInterval: false
	});
	const userProjectsQuery = api.project.getEnrolled.useQuery(undefined, {
		initialData: initialUserProjectsData || undefined,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchInterval: false
	});

	const filteredProjects = useMemo(() => {
		const filters: FilterConfig[] = [
			{
				value: searchTerm === '' ? null : searchTerm,
				property: (project) => project?.title,
				customComparison: (project, value) =>
					project?.title.toLowerCase().includes(value.toLowerCase())
			} as FilterConfig,
			{
				value: categoryFilter === 'all' ? null : categoryFilter,
				property: (project) => project?.category.name
			} as FilterConfig,
			{
				value: difficultyFilter === 'all' ? null : difficultyFilter,
				property: (project) => project?.difficulty
			} as FilterConfig,
			{
				value: costFilter === 'all' ? null : costFilter,
				property: (project) => project?.credits,
				customComparison: (project, value) => {
					if (value === 'Free') {
						return project.accessType === 'FREE';
					}
					if (value === 'Credits') {
						return project.accessType === 'CREDITS';
					}
					if (value === 'Mentorship') {
						return project.accessType === 'MENTORSHIP';
					}
					return true;
				}
			} as FilterConfig
		];
		return (
			projectsQuery.data?.filter((project) =>
				filters.every((filterConfig) => createFilter(project, filterConfig))
			) ?? []
		);
	}, [
		projectsQuery.data,
		searchTerm,
		categoryFilter,
		difficultyFilter,
		costFilter
	]);

	return {
		searchTerm,
		setSearchTerm,
		categoryFilter,
		setCategoryFilter,
		difficultyFilter,
		setDifficultyFilter,
		costFilter,
		setCostFilter,
		userProjects: userProjectsQuery.data,
		filteredProjects,
		isLoading: projectsQuery.isLoading || userProjectsQuery.isLoading
	};
}
