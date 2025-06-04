import { useQueryState } from 'nuqs';

export const useProjectFilter = () => {
	const [searchTerm, setSearchTerm] = useQueryState('search');
	const [categoryFilter, setCategoryFilter] = useQueryState('category', {
		defaultValue: 'all'
	});
	const [difficultyFilter, setDifficultyFilter] = useQueryState('difficulty', {
		defaultValue: 'all'
	});
	const [costFilter, setCostFilter] = useQueryState('cost', {
		defaultValue: 'all'
	});

	return {
		searchTerm,
		categoryFilter,
		difficultyFilter,
		costFilter,
		setSearchTerm,
		setCategoryFilter,
		setDifficultyFilter,
		setCostFilter
	};
};
