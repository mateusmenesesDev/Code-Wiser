import { faker } from '@faker-js/faker';
import { ProjectDifficultyEnum } from '@prisma/client';
import { EPIC_TEMPLATES } from '../data/epics';

export function generateEpics(difficulty: ProjectDifficultyEnum) {
	const numEpics =
		difficulty === ProjectDifficultyEnum.BEGINNER
			? 2
			: difficulty === ProjectDifficultyEnum.INTERMEDIATE
				? 3
				: 4;

	return faker.helpers.arrayElements(EPIC_TEMPLATES, {
		min: numEpics,
		max: numEpics
	});
}
