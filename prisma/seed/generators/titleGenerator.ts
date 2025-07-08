import { faker } from '@faker-js/faker';

const TITLE_ADJECTIVES = [
	'Modern',
	'Advanced',
	'Smart',
	'Professional',
	'Complete',
	'Comprehensive',
	'Full-Stack',
	'Responsive',
	'Interactive'
] as const;

const TITLE_SUFFIXES = [
	'Platform',
	'System',
	'Application',
	'Tool',
	'Hub',
	'Studio',
	'Manager',
	'Portal',
	'Dashboard'
] as const;

const TITLE_BRANDS = ['Pro', 'Plus', 'Max', 'Hub', 'Lab'] as const;

const TITLE_PREFIXES = {
	'Web Development': ['Web', 'React', 'Vue', 'Angular', 'Next.js'],
	'Mobile Development': ['Mobile', 'React Native', 'Flutter', 'iOS', 'Android'],
	'Backend Development': ['API', 'Server', 'Backend', 'Node.js', 'Express'],
	'Data Science': ['Data', 'Analytics', 'ML', 'AI', 'Prediction'],
	DevOps: ['CI/CD', 'Cloud', 'Docker', 'Kubernetes', 'Pipeline'],
	'Game Development': ['Game', 'Unity', 'Unreal', '3D', 'VR'],
	'Desktop Development': ['Desktop', 'Electron', 'Windows', 'macOS', 'Linux']
} as const;

type TitleStructure = (prefix: string, category: string) => string;

const titleStructures: TitleStructure[] = [
	(prefix, _) =>
		`${faker.helpers.arrayElement(TITLE_ADJECTIVES)} ${prefix} ${faker.helpers.arrayElement(TITLE_SUFFIXES)}`,
	(prefix, category) =>
		`${prefix} ${faker.helpers.arrayElement(TITLE_SUFFIXES)} for ${category}`,
	(prefix, _) => `${faker.company.name().split(' ')[0]} ${prefix}`,
	(prefix, _) => `${prefix} ${faker.helpers.arrayElement(TITLE_SUFFIXES)}`,
	(prefix, _) => `${faker.helpers.arrayElement(TITLE_ADJECTIVES)} ${prefix}`,
	(prefix, _) => `${prefix}${faker.helpers.arrayElement(TITLE_BRANDS)}`
];

export function generateTitle(category: string): string {
	const prefixes =
		TITLE_PREFIXES[category as keyof typeof TITLE_PREFIXES] ||
		TITLE_PREFIXES['Web Development'];
	const prefix = faker.helpers.arrayElement(prefixes);
	return faker.helpers.arrayElement(titleStructures)(prefix, category);
}
