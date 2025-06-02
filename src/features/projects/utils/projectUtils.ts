import type { Category, Prisma } from '@prisma/client';
import slugify from 'slugify';

export function createProjectData(
	input: Prisma.ProjectCreateInput,
	category: Category
): Prisma.ProjectCreateInput {
	return {
		...input,
		slug: slugify(input.title),
		category: { connect: { id: category.id } },
		difficulty: input.difficulty
	};
}
