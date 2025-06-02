import type { Category, Prisma } from '@prisma/client';
import slugify from 'slugify';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

export function createProjectData(
	input: ProjectTemplateFormData,
	category: Category
): Prisma.ProjectCreateInput {
	return {
		...input,
		slug: slugify(input.title),
		category: { connect: { id: category.id } },
		difficulty: input.difficulty
	};
}
