type WithCategory = {
	category: { name: string };
};

export type FilterConfig<T extends WithCategory = WithCategory> = {
	value: string | null;
	property: keyof T | ((project: T) => string | number);
	customComparison?: (project: T, value: string) => boolean;
};

export const createFilter = <T extends WithCategory>(
	project: T,
	{ value, property, customComparison }: FilterConfig<T>
) => {
	if (!value) return true;

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
