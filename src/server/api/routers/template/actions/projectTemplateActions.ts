import type { Prisma } from '@prisma/client';
import slugify from 'slugify';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

export function createProjectTemplateData(
	input: ProjectTemplateFormData
): Prisma.ProjectTemplateCreateInput {
	return {
		...input,
		slug: slugify(input.title, { lower: true }),
		category: {
			connectOrCreate: {
				where: { name: input.category },
				create: { name: input.category }
			}
		},
		credits: input.credits ?? 0,
		technologies: {
			connectOrCreate: input.technologies.map((tech) => ({
				where: { name: tech },
				create: { name: tech }
			}))
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
