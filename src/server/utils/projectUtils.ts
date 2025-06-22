import type { Category, Prisma } from '@prisma/client';
import slugify from 'slugify';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

export function createProjectData(
	input: ProjectTemplateFormData,
	category: Category
): Prisma.ProjectCreateInput {
	return {
		title: input.title,
		description: input.description,
		slug: slugify(input.title),
		category: { connect: { id: category.id } },
		difficulty: input.difficulty,
		accessType: input.accessType,
		methodology: input.methodology,
		minParticipants: input.minParticipants,
		maxParticipants: input.maxParticipants,
		figmaProjectUrl: input.figmaProjectUrl
	};
}
