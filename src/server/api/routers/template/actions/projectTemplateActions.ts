import type { Prisma } from '@prisma/client';
import slugify from 'slugify';
import type { ProjectFormData } from '~/features/projects/types/Projects.type';

export function createProjectTemplateData(
	input: ProjectFormData,
	userId: string
): Prisma.ProjectTemplateCreateInput {
	return {
		...input,
		slug: slugify(input.title, { lower: true }),
		author: { connect: { id: userId } },
		category: { connect: { name: input.category } },
		credits: input.credits ?? 0,
		technologies: {
			connect: input.technologies.map((tech) => ({ name: tech }))
		},
		learningOutcomes: {
			create: input.learningOutcomes.map((outcome) => ({
				value: outcome.value
			}))
		},
		milestones: {
			create:
				input.milestones?.map((milestone) => ({
					title: milestone.value
				})) ?? []
		},
		images: {
			create: input.images?.map((image) => ({ url: image.file.name }))
		}
	};
}
