import type { PrismaClient } from '@prisma/client';
import { COMPETENCIES } from '../data/competencies';

export async function createCompetencies(prisma: PrismaClient) {
	console.log('🧭 Creating competency catalog...');

	for (const competencyData of COMPETENCIES) {
		const competency = await prisma.competency.upsert({
			where: { slug: competencyData.slug },
			update: {
				name: competencyData.name,
				description: competencyData.description,
				sortOrder: competencyData.sortOrder,
				isActive: true
			},
			create: {
				slug: competencyData.slug,
				name: competencyData.name,
				description: competencyData.description,
				sortOrder: competencyData.sortOrder
			}
		});

		for (const category of competencyData.reviewCategories) {
			await prisma.competencyReviewCategory.upsert({
				where: {
					competencyId_category: {
						competencyId: competency.id,
						category
					}
				},
				update: {},
				create: { competencyId: competency.id, category }
			});
		}

		for (const mapping of competencyData.challengeMappings) {
			const challenges = await prisma.exerciseChallenge.findMany({
				where: {
					slug: { in: mapping.challengeSlugs },
					track: { slug: mapping.trackSlug }
				},
				select: { id: true }
			});

			for (const challenge of challenges) {
				await prisma.competencyExerciseChallenge.upsert({
					where: {
						competencyId_challengeId: {
							competencyId: competency.id,
							challengeId: challenge.id
						}
					},
					update: {},
					create: {
						competencyId: competency.id,
						challengeId: challenge.id
					}
				});
			}
		}
	}

	return prisma.competency.findMany({
		where: { isActive: true },
		orderBy: { sortOrder: 'asc' }
	});
}
