import type { ProjectTemplateApiOutput } from '../types/Projects.type';

export type FilterConfig = {
	value: string | null;
	property:
		| keyof ProjectTemplateApiOutput
		| ((project: ProjectTemplateApiOutput) => string | number);
	customComparison?: (
		project: NonNullable<ProjectTemplateApiOutput>,
		value: string
	) => boolean;
};

export const createFilter = (
	project: NonNullable<ProjectTemplateApiOutput>,
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
