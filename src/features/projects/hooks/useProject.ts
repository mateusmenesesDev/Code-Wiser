import { api } from '~/trpc/react';

import type { ProjectTemplateApiResponse } from '../types/Projects.type';

import { useProjectFilter } from './useProjectFilter';

type FilterConfig = {
	value: string | null;
	defaultValue: string;
	property:
		| keyof ProjectTemplateApiResponse
		| ((project: ProjectTemplateApiResponse) => string | number);
	customComparison?: (
		project: ProjectTemplateApiResponse,
		value: string
	) => boolean;
};

const createFilter = (
	project: ProjectTemplateApiResponse,
	{ value, defaultValue, property, customComparison }: FilterConfig
) => {
	if (value === defaultValue || !value) return true;

	if (customComparison) {
		return customComparison(project, value);
	}

	const projectValue =
		typeof property === 'function'
			? property(project)
			: property === 'category'
				? project.category.name
				: project[property];

	return String(projectValue).toLowerCase() === value.toLowerCase();
};

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
			defaultValue: 'All',
			property: 'title',
			customComparison: (project, value) =>
				project.title.toLowerCase().includes(value.toLowerCase())
		},
		{
			value: categoryFilter,
			defaultValue: 'All',
			property: 'category'
		},
		{
			value: difficultyFilter,
			defaultValue: 'All',
			property: 'difficulty'
		},
		{
			value: costFilter,
			defaultValue: 'All',
			property: 'credits',
			customComparison: (project, value) =>
				value === 'Free'
					? project.credits === 0
					: project.credits != null && project.credits > 0
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
