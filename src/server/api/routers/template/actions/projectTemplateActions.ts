import type { Prisma } from '@prisma/client';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';
import { generatePublicCode } from '~/lib/publicTaskId';
import type { db } from '~/server/db';

type DbClient = Pick<typeof db, 'projectTemplate'>;

export async function getNextTemplateSortOrder(
	prisma: DbClient
): Promise<number> {
	const result = await prisma.projectTemplate.aggregate({
		_max: { sortOrder: true }
	});

	return (result._max.sortOrder ?? -1) + 1;
}

export function createProjectTemplateData(
	input: ProjectTemplateFormData,
	sortOrder = 0
): Prisma.ProjectTemplateCreateInput {
	return {
		...input,
		publicCode: generatePublicCode(input.title),
		sortOrder,
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
