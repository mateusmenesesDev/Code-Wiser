import type { Prisma } from '@prisma/client';
import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum
} from '@prisma/client';
import { z } from 'zod';

/** Shared lean catalog include for getApproved and performance benches. */
export const approvedCatalogInclude = {
	category: true,
	technologies: true,
	images: {
		orderBy: {
			order: 'asc' as const
		},
		select: {
			url: true,
			alt: true
		}
	},
	_count: {
		select: {
			tasks: true
		}
	}
};

export const approvedCatalogInputSchema = z
	.object({
		search: z.string().trim().min(1).max(100).optional(),
		category: z.string().trim().min(1).max(100).optional(),
		technologies: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
		difficulty: z.nativeEnum(ProjectDifficultyEnum).optional(),
		methodology: z.nativeEnum(ProjectMethodologyEnum).optional(),
		accessType: z.nativeEnum(ProjectAccessTypeEnum).optional(),
		sort: z.enum(['relevance', 'newest', 'difficulty']).default('relevance')
	})
	.optional();

export type ApprovedCatalogSort = 'relevance' | 'newest' | 'difficulty';

export const approvedCatalogOrderBy = [
	{ sortOrder: 'asc' as const },
	{ createdAt: 'asc' as const }
];

export function getApprovedCatalogOrderBy(
	sort: ApprovedCatalogSort
): Prisma.ProjectTemplateOrderByWithRelationInput[] {
	if (sort === 'newest') {
		return [{ createdAt: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }];
	}

	return approvedCatalogOrderBy;
}

type ApprovedCatalogProject = Prisma.ProjectTemplateGetPayload<{
	include: typeof approvedCatalogInclude;
}>;

const difficultyRank: Record<ProjectDifficultyEnum, number> = {
	[ProjectDifficultyEnum.BEGINNER]: 0,
	[ProjectDifficultyEnum.INTERMEDIATE]: 1,
	[ProjectDifficultyEnum.ADVANCED]: 2
};

function compareCatalogOrder(
	left: ApprovedCatalogProject,
	right: ApprovedCatalogProject,
	sort: ApprovedCatalogSort,
	search?: string
) {
	if (sort === 'difficulty') {
		const difficultyDifference =
			difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
		if (difficultyDifference !== 0) return difficultyDifference;
	}

	if (sort === 'relevance' && search) {
		const needle = search.toLowerCase();
		const score = (project: ApprovedCatalogProject) => {
			const title = project.title.toLowerCase();
			const description = project.description.toLowerCase();
			if (title === needle) return 4;
			if (title.startsWith(needle)) return 3;
			if (title.includes(needle)) return 2;
			if (description.includes(needle)) return 1;
			return 0;
		};
		const relevanceDifference = score(right) - score(left);
		if (relevanceDifference !== 0) return relevanceDifference;
	}

	if (sort === 'newest') {
		const createdAtDifference =
			right.createdAt.getTime() - left.createdAt.getTime();
		if (createdAtDifference !== 0) return createdAtDifference;
	}

	const sortOrderDifference = left.sortOrder - right.sortOrder;
	if (sortOrderDifference !== 0) return sortOrderDifference;

	const createdAtDifference =
		left.createdAt.getTime() - right.createdAt.getTime();
	if (createdAtDifference !== 0) return createdAtDifference;

	return left.id.localeCompare(right.id);
}

export function sortApprovedCatalog(
	projects: ApprovedCatalogProject[],
	sort: ApprovedCatalogSort,
	search?: string
) {
	return [...projects].sort((left, right) =>
		compareCatalogOrder(left, right, sort, search)
	);
}
