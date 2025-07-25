import type { Prisma } from '@prisma/client';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

export function createProjectTemplateData(
	input: ProjectTemplateFormData
): Prisma.ProjectTemplateCreateInput {
	return {
		...input,
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
			create:
				input.learningOutcomes?.map((outcome) => ({
					value: outcome
				})) ?? []
		},
		milestones: {
			create:
				input.milestones?.map((milestone, index) => ({
					title: milestone,
					order: index
				})) ?? []
		},
		preRequisites: input.preRequisites,
		images: {
			create: input.images?.map((image) => ({ url: image.url }))
		}
	};
}
