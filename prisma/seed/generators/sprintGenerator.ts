import { faker } from '@faker-js/faker';
import { ProjectDifficultyEnum } from '@prisma/client';
import { SPRINT_TEMPLATES } from '../data/sprints';
import { seedLogger } from '../utils/logger';

const SPRINTS_PER_DIFFICULTY: Record<ProjectDifficultyEnum, number> = {
	[ProjectDifficultyEnum.BEGINNER]: 3,
	[ProjectDifficultyEnum.INTERMEDIATE]: 4,
	[ProjectDifficultyEnum.ADVANCED]: 6
};

export function generateSprints(difficulty: ProjectDifficultyEnum) {
	const numSprints = SPRINTS_PER_DIFFICULTY[difficulty];
	const selectedSprints = faker.helpers
		.arrayElements(SPRINT_TEMPLATES, { min: numSprints, max: numSprints })
		.map((sprint, index) => ({
			...sprint,
			order: index
		}));

	seedLogger.detail(
		`Generated ${selectedSprints.length} sprints for ${difficulty} difficulty:\n${selectedSprints.map((sprint) => `  - ${sprint.title} (Order: ${sprint.order})`).join('\n')}`
	);

	return selectedSprints;
}
