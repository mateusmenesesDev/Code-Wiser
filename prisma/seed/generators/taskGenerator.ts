import { faker } from '@faker-js/faker';
import type {
	TaskPriorityEnum,
	TaskStatusEnum,
	TaskTypeEnum
} from '@prisma/client';
import { ProjectDifficultyEnum } from '@prisma/client';
import {
	ADVANCED_TASKS,
	COMMON_TASKS,
	INTERMEDIATE_TASKS,
	TASK_TEMPLATES
} from '../data/tasks';

export function generateTasks(difficulty: ProjectDifficultyEnum) {
	const baseTasks: Array<{
		title: string;
		description: string;
		type: TaskTypeEnum;
		priority: TaskPriorityEnum;
		status: TaskStatusEnum;
		tags: string[];
	}> = faker.helpers
		.arrayElements(TASK_TEMPLATES, { min: 4, max: 6 })
		.map((template) => ({
			title: template.title(),
			description: template.description(),
			type: template.type,
			priority: template.priority(),
			status: template.status,
			tags: template.tags()
		}));

	if (
		difficulty === ProjectDifficultyEnum.INTERMEDIATE ||
		difficulty === ProjectDifficultyEnum.ADVANCED
	) {
		baseTasks.push(...INTERMEDIATE_TASKS);
	}

	if (difficulty === ProjectDifficultyEnum.ADVANCED) {
		baseTasks.push(...ADVANCED_TASKS);
	}

	baseTasks.push(...COMMON_TASKS);

	return baseTasks;
}
