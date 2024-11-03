import { useQueryState } from 'nuqs';

export const useProjectFilter = () => {
	const [searchTerm, setSearchTerm] = useQueryState('search');
	const [categoryFilter, setCategoryFilter] = useQueryState('category');
	const [difficultyFilter, setDifficultyFilter] = useQueryState('difficulty');
	const [costFilter, setCostFilter] = useQueryState('cost');

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
