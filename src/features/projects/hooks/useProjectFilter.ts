import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';

export const useProjectFilter = () => {
	const [searchTerm, setSearchTerm] = useQueryState('search', {
		defaultValue: ''
	});
	const [categoryFilter, setCategoryFilter] = useQueryState('category', {
		defaultValue: 'all'
	});
	const [difficultyFilter, setDifficultyFilter] = useQueryState('difficulty', {
		defaultValue: 'all'
	});
	const [costFilter, setCostFilter] = useQueryState('cost', {
		defaultValue: 'all'
	});
	const [technologiesFilter, setTechnologiesFilter] = useQueryState(
		'technologies',
		parseAsArrayOf(parseAsString).withDefault([])
	);
	const [methodologyFilter, setMethodologyFilter] = useQueryState(
		'methodology',
		{ defaultValue: 'all' }
	);
	const [sortFilter, setSortFilter] = useQueryState('sort', {
		defaultValue: 'relevance'
	});

	return {
		searchTerm,
		categoryFilter,
		difficultyFilter,
		costFilter,
		technologiesFilter,
		methodologyFilter,
		sortFilter,
		setSearchTerm,
		setCategoryFilter,
		setDifficultyFilter,
		setCostFilter,
		setTechnologiesFilter,
		setMethodologyFilter,
		setSortFilter
	};
};
