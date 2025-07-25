import type { Category, Prisma } from '@prisma/client';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

export function createProjectData(
	input: ProjectTemplateFormData,
	category: Category
): Prisma.ProjectCreateInput {
	return {
		title: input.title,
		description: input.description,
		id: input.title,
		category: { connect: { id: category.id } },
		difficulty: input.difficulty,
		accessType: input.accessType,
		methodology: input.methodology,
		minParticipants: input.minParticipants,
		maxParticipants: input.maxParticipants,
		figmaProjectUrl: input.figmaProjectUrl
	};
}
