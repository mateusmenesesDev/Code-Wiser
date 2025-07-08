import { faker } from '@faker-js/faker';
import type { ProjectTemplate } from '../data/projectTemplates';

export function generateProjectTitle(
	template: ProjectTemplate,
	category: string
) {
	const adjectives = [
		'Modern',
		'Advanced',
		'Smart',
		'Professional',
		'Complete',
		'Comprehensive',
		'Full-Stack',
		'Responsive',
		'Interactive'
	];

	const suffixes = [
		'Platform',
		'System',
		'Application',
		'Tool',
		'Hub',
		'Studio',
		'Manager',
		'Portal',
		'Dashboard'
	];

	const structures = [
		() =>
			`${faker.helpers.arrayElement(adjectives)} ${template.prefix} ${faker.helpers.arrayElement(suffixes)}`,
		() =>
			`${template.prefix} ${faker.helpers.arrayElement(suffixes)} for ${category}`,
		() => `${faker.company.name().split(' ')[0]} ${template.prefix}`,
		() => `${template.prefix} ${faker.helpers.arrayElement(suffixes)}`,
		() => `${faker.helpers.arrayElement(adjectives)} ${template.prefix}`,
		() =>
			`${template.prefix}${faker.helpers.arrayElement(['Pro', 'Plus', 'Max', 'Hub', 'Lab'])}`
	];

	return faker.helpers.arrayElement(structures)();
}
