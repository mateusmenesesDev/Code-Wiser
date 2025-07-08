import type { PrismaClient } from '@prisma/client';
import { createCategories } from './generators/categoryGenerator';
import { createTechnologies } from './generators/technologyGenerator';
import { createProjectTemplates } from './generators/templateGenerator';
import { seedLogger } from './utils/logger';

export async function orchestrateSeedDataCreation(prisma: PrismaClient) {
	seedLogger.info('Starting seed data generation...');

	try {
		seedLogger.info('Generating categories...', 1);
		const categories = await createCategories(prisma);

		seedLogger.info('Generating technologies...', 1);
		const technologies = await createTechnologies(prisma);

		seedLogger.info('Generating project templates...', 1);
		const { templates, totalTasks, sprintsByDifficulty } =
			await createProjectTemplates(prisma, categories, technologies);

		seedLogger.summary({
			categories: categories.length,
			technologies: technologies.length,
			templates: templates.length,
			tasks: totalTasks,
			sprints: {
				count: Object.values(sprintsByDifficulty).reduce(
					(acc, curr) => acc + curr,
					0
				),
				details: [
					`Beginner: ${sprintsByDifficulty.BEGINNER} sprints`,
					`Intermediate: ${sprintsByDifficulty.INTERMEDIATE} sprints`,
					`Advanced: ${sprintsByDifficulty.ADVANCED} sprints`
				]
			}
		});

		seedLogger.success('Seed data generation completed successfully!');
	} catch (error) {
		seedLogger.error(
			'Failed to generate seed data',
			error instanceof Error ? error : undefined
		);
		throw error;
	}
}
