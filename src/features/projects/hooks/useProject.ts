import { api } from '~/trpc/react';

import { type FilterConfig, createFilter } from '../utils/filterUtils';

import { useProjectFilter } from './useProjectFilter';

export function useProject() {
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

	const projectsQuery = api.projectTemplate.getApproved.useQuery();
	const userProjectsQuery = api.project.getEnrolled.useQuery();
	const userCreditsQuery = api.user.getCredits.useQuery();

	const filters: FilterConfig[] = [
		{
			value: searchTerm,
			property: 'title',
			customComparison: (project, value) =>
				project.title.toLowerCase().includes(value.toLowerCase())
		},
		{
			value: categoryFilter === 'all' ? null : categoryFilter,
			property: 'category'
		},
		{
			value: difficultyFilter === 'all' ? null : difficultyFilter,
			property: 'difficulty'
		},
		{
			value: costFilter === 'all' ? null : costFilter,
			property: 'credits',
			customComparison: (project, value) => {
				if (value === 'Free') {
					return project.credits === 0 || project.credits === null;
				}
				if (value === 'Credits') {
					return project.credits != null && project.credits > 0;
				}
				return true;
			}
		}
	];

	const filteredProjects = projectsQuery.data?.filter((project) =>
		filters.every((filterConfig) => createFilter(project, filterConfig))
	);

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
		userCredits: userCreditsQuery.data?.credits ?? 0,
		isLoading:
			projectsQuery.isLoading ||
			userProjectsQuery.isLoading ||
			userCreditsQuery.isLoading
	};
}
