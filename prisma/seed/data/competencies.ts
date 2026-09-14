import type { PRReviewFindingCategory } from '@prisma/client';

export type CompetencySeed = {
	slug: string;
	name: string;
	description: string;
	sortOrder: number;
	reviewCategories: PRReviewFindingCategory[];
	challengeMappings: Array<{ trackSlug: string; challengeSlugs: string[] }>;
};

export const COMPETENCIES: CompetencySeed[] = [
	{
		slug: 'ui-accessibility',
		name: 'UI and accessibility',
		description:
			'Build interfaces that are usable, understandable, and accessible.',
		sortOrder: 0,
		reviewCategories: ['DESIGN', 'READABILITY'],
		challengeMappings: [
			{ trackSlug: 'react', challengeSlugs: ['counter', 'todo-list'] }
		]
	},
	{
		slug: 'testing',
		name: 'Testing',
		description: 'Use tests to protect behavior and make changes safely.',
		sortOrder: 1,
		reviewCategories: ['TESTS'],
		challengeMappings: [
			{ trackSlug: 'react', challengeSlugs: ['todo-list'] },
			{ trackSlug: 'javascript', challengeSlugs: ['async-fetch-wrapper'] }
		]
	},
	{
		slug: 'javascript-typescript',
		name: 'JavaScript and TypeScript',
		description: 'Write clear, type-safe application logic.',
		sortOrder: 2,
		reviewCategories: ['CORRECTION', 'READABILITY'],
		challengeMappings: [
			{
				trackSlug: 'javascript',
				challengeSlugs: ['array-utilities', 'async-fetch-wrapper']
			},
			{
				trackSlug: 'typescript',
				challengeSlugs: ['typed-api-client', 'discriminated-unions']
			}
		]
	},
	{
		slug: 'git-collaboration',
		name: 'Git and collaboration',
		description: 'Communicate changes clearly and work safely with a team.',
		sortOrder: 3,
		reviewCategories: ['CORRECTION', 'READABILITY'],
		challengeMappings: []
	},
	{
		slug: 'data-modeling',
		name: 'Data modeling',
		description: 'Model data and behavior around clear domain rules.',
		sortOrder: 4,
		reviewCategories: ['DESIGN', 'PERFORMANCE'],
		challengeMappings: []
	},
	{
		slug: 'architecture',
		name: 'Architecture',
		description: 'Make coherent trade-offs across application boundaries.',
		sortOrder: 5,
		reviewCategories: ['DESIGN', 'SECURITY', 'PERFORMANCE'],
		challengeMappings: [
			{
				trackSlug: 'nextjs',
				challengeSlugs: ['server-component-page', 'route-handler-crud']
			}
		]
	}
];
