import type { Category, Prisma, Technology } from '@prisma/client';
import slugify from 'slugify';
import type { ProjectFormData } from '~/features/projects/types/Projects.type';

export function createProjectData(
	input: ProjectFormData,
	category: Category,
	technologies: Technology[]
): Prisma.ProjectCreateInput {
	return {
		...input,
		slug: slugify(input.title),
		category: { connect: { id: category.id } },
		difficulty: input.difficulty,
		credits: input.credits ?? 0,
		technologies: { connect: technologies.map((tech) => ({ id: tech.id })) },
		learningOutcomes: {
			create: input.learningOutcomes.map((outcome) => ({
				value: outcome.value
			}))
		},
		milestones: {
			create: input.milestones?.map((milestone) => ({
				title: milestone.value
			}))
		},
		images: {
			create: input.images?.map((image) => ({ url: image.file.name }))
		}
	};
}
