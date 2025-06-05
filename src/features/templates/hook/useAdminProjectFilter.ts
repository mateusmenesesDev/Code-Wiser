import { useQueryState } from 'nuqs';
import { useProjectFilter } from '~/features/projects/hooks/useProjectFilter';

export const useAdminProjectFilter = () => {
	// Reuse the existing project filters
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

	// Add admin-specific status filter
	const [statusFilter, setStatusFilter] = useQueryState('status', {
		defaultValue: 'all'
	});

	const clearFilters = () => {
		setSearchTerm(null);
		setCategoryFilter('all');
		setDifficultyFilter('all');
		setCostFilter('all');
		setStatusFilter('all');
	};

	const hasActiveFilters =
		searchTerm ||
		categoryFilter !== 'all' ||
		difficultyFilter !== 'all' ||
		costFilter !== 'all' ||
		statusFilter !== 'all';

	return {
		// Search
		searchTerm,
		setSearchTerm,

		// Category
		categoryFilter,
		setCategoryFilter,

		// Difficulty
		difficultyFilter,
		setDifficultyFilter,

		// Access (cost filter maps to access filter)
		accessFilter: costFilter,
		setAccessFilter: setCostFilter,

		// Status (admin-specific)
		statusFilter,
		setStatusFilter,

		// Utilities
		clearFilters,
		hasActiveFilters
	};
};
