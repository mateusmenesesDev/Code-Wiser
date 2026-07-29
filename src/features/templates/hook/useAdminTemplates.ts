'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	type FilterConfig,
	createFilter
} from '~/features/projects/utils/filterUtils';
import { api, type RouterOutputs } from '~/trpc/react';
import { useAdminProjectFilter } from './useAdminProjectFilter';

type AdminTemplate = RouterOutputs['projectTemplate']['getAll'][number];

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
	const [orderedTemplates, setOrderedTemplates] = useState<AdminTemplate[]>(
		[]
	);

	// Queries
	const templatesQuery = api.projectTemplate.getAll.useQuery();

	useEffect(() => {
		if (templatesQuery.data) {
			setOrderedTemplates(templatesQuery.data);
		}
	}, [templatesQuery.data]);

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

	const reorderMutation = api.projectTemplate.reorder.useMutation({
		onSuccess: () => {
			utils.projectTemplate.getAll.invalidate();
			utils.projectTemplate.getApproved.invalidate();
		},
		onError: (error) => {
			if (templatesQuery.data) {
				setOrderedTemplates(templatesQuery.data);
			}
			toast.error(error.message || 'Failed to reorder templates');
		}
	});

	// Filter logic
	const filteredTemplates = orderedTemplates.filter((template) => {
		const filters: FilterConfig<AdminTemplate>[] = [
			{
				value: searchTerm,
				property: (project) => project.title || '',
				customComparison: (project, value) =>
					project.title.toLowerCase().includes(value.toLowerCase()) ||
					project.description.toLowerCase().includes(value.toLowerCase())
			},
			{
				value: categoryFilter === 'all' ? null : categoryFilter,
				property: (project) => project.category.name || ''
			},
			{
				value: difficultyFilter === 'all' ? null : difficultyFilter,
				property: (project) => project.difficulty || ''
			},
			{
				value: accessFilter === 'all' ? null : accessFilter,
				property: (project) => project.credits || 0,
				customComparison: (project, value) => {
					const accessType =
						project.credits && project.credits > 0 ? 'Credits' : 'Free';
					return accessType === value;
				}
			},
			{
				value: statusFilter === 'all' ? null : statusFilter,
				property: (project) => project.status
			}
		];

		return filters.every((filterConfig) => createFilter(template, filterConfig));
	});

	const canReorder = !hasActiveFilters;

	// Actions
	const deleteTemplate = (id: string) => {
		deleteTemplateMutation.mutate({ id });
	};

	const togglePublishStatus = (id: string, currentStatus: string) => {
		const newStatus = currentStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
		togglePublishMutation.mutate({ id, status: newStatus });
	};

	const reorderTemplates = (nextTemplates: AdminTemplate[]) => {
		const withSortOrder = nextTemplates.map((template, sortOrder) => ({
			...template,
			sortOrder
		}));
		setOrderedTemplates(withSortOrder);
		reorderMutation.mutate({
			items: withSortOrder.map((template) => ({
				id: template.id,
				sortOrder: template.sortOrder
			}))
		});
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
		canReorder,

		// Actions
		deleteTemplate,
		togglePublishStatus,
		reorderTemplates,
		refetch: templatesQuery.refetch,

		// Loading states
		isDeleting: deleteTemplateMutation.isPending,
		isToggling: togglePublishMutation.isPending,
		isReordering: reorderMutation.isPending
	};
}
