import type { ProjectTemplateApiResponse } from '../types/Projects.type';

export type FilterConfig = {
	value: string | null;
	property:
		| keyof ProjectTemplateApiResponse
		| ((project: ProjectTemplateApiResponse) => string | number);
	customComparison?: (
		project: ProjectTemplateApiResponse,
		value: string
	) => boolean;
};

export const createFilter = (
	project: ProjectTemplateApiResponse,
	{ value, property, customComparison }: FilterConfig
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
