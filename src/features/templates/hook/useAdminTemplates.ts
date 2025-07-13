'use client';

import { toast } from 'sonner';
import type { ProjectTemplateApiOutput } from '~/features/projects/types/Projects.type';
import {
	type FilterConfig,
	createFilter
} from '~/features/projects/utils/filterUtils';
import { api } from '~/trpc/react';
import { useAdminProjectFilter } from './useAdminProjectFilter';

export function useAdminTemplates() {
	const {
		searchTerm,
		setSearchTerm,
		categoryFilter,
		setCategoryFilter,
		accessFilter,
		setAccessFilter,
		difficultyFilter,
		setDifficultyFilter,
		statusFilter,
		setStatusFilter,
		clearFilters,
		hasActiveFilters
	} = useAdminProjectFilter();

	const utils = api.useUtils();

	// Queries
	const templatesQuery = api.projectTemplate.getAll.useQuery();

	// Mutations
	const deleteTemplateMutation = api.projectTemplate.delete.useMutation({
		onSuccess: () => {
			toast.success('Template deleted successfully');
			utils.projectTemplate.getAll.invalidate();
		},
		onError: () => {
			toast.error('Failed to delete template');
		}
	});

	const togglePublishMutation = api.projectTemplate.updateStatus.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.status === 'APPROVED'
					? 'Template published successfully'
					: 'Template unpublished successfully'
			);
			utils.projectTemplate.getAll.invalidate();
		},
		onError: () => {
			toast.error('Failed to update template status');
		}
	});

	// Filter logic
	const filteredTemplates = templatesQuery.data?.filter((template) => {
		const filters: FilterConfig[] = [
			{
				value: searchTerm,
				property: (project) => project?.title || '',
				customComparison: (
					project: NonNullable<ProjectTemplateApiOutput>,
					value: string
				) =>
					project?.title?.toLowerCase().includes(value.toLowerCase()) ||
					project?.description?.toLowerCase().includes(value.toLowerCase())
			},
			{
				value: categoryFilter === 'all' ? null : categoryFilter,
				property: (project) => project?.category.name || ''
			},
			{
				value: difficultyFilter === 'all' ? null : difficultyFilter,
				property: (project) => project?.difficulty || ''
			},
			{
				value: accessFilter === 'all' ? null : accessFilter,
				property: (project) => project?.credits || 0,
				customComparison: (
					project: NonNullable<ProjectTemplateApiOutput>,
					value: string
				) => {
					const accessType =
						project?.credits && project?.credits > 0 ? 'Credits' : 'Free';
					return accessType === value;
				}
			},
			{
				value: statusFilter === 'all' ? null : statusFilter,
				property: (project) => project?.status
			} as FilterConfig
		];

		return filters.every((filterConfig) =>
			createFilter(
				template as NonNullable<ProjectTemplateApiOutput>,
				filterConfig
			)
		);
	});

	// Actions
	const deleteTemplate = (id: string) => {
		deleteTemplateMutation.mutate({ id });
	};

	const togglePublishStatus = (id: string, currentStatus: string) => {
		const newStatus = currentStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
		togglePublishMutation.mutate({ id, status: newStatus });
	};

	return {
		// Data
		templates: filteredTemplates,
		isLoading: templatesQuery.isLoading,

		// Filters
		searchTerm,
		setSearchTerm,
		categoryFilter,
		setCategoryFilter,
		accessFilter,
		setAccessFilter,
		difficultyFilter,
		setDifficultyFilter,
		statusFilter,
		setStatusFilter,
		clearFilters,
		hasActiveFilters,

		// Actions
		deleteTemplate,
		togglePublishStatus,
		refetch: templatesQuery.refetch,

		// Loading states
		isDeleting: deleteTemplateMutation.isPending,
		isToggling: togglePublishMutation.isPending
	};
}
