import { faker } from '@faker-js/faker';
import type {
	ProjectTemplate as DbProjectTemplate,
	PrismaClient
} from '@prisma/client';
import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum,
	ProjectStatusEnum
} from '@prisma/client';
import { TECH_STACKS } from '../data/technologies';
import { seedLogger } from '../utils/logger';
import { generateEpics } from './epicGenerator';
import { generateSprints } from './sprintGenerator';
import { generateTasks } from './taskGenerator';
import { generateTitle } from './titleGenerator';

interface Category {
	id: string;
	name: string;
}

interface Technology {
	id: string;
	name: string;
}

interface TemplateGeneratorResult {
	templates: DbProjectTemplate[];
	totalTasks: number;
	sprintsByDifficulty: Record<ProjectDifficultyEnum, number>;
}

const generateTemplateDescription = (
	baseDescription: string,
	selectedTechNames: string[]
): string => {
	const businessContext = faker.helpers.arrayElement([
		`for ${faker.company.buzzPhrase()}`,
		`targeting ${faker.helpers.arrayElement(['startups', 'enterprises', 'small businesses', 'freelancers', 'teams'])}`,
		`focused on ${faker.hacker.noun()} optimization`,
		`with ${faker.hacker.adjective()} scalability`,
		`designed for ${faker.word.adjective()} performance`
	]);

	const learningOutcome = faker.helpers.arrayElement([
		`master ${selectedTechNames.slice(0, 2).join(' and ')}`,
		`understand ${faker.hacker.adjective()} architecture patterns`,
		`implement ${faker.word.adjective()} best practices`,
		`develop ${faker.hacker.noun()} optimization skills`,
		`learn ${faker.hacker.adjective()} development workflows`
	]);

	return `${baseDescription} ${businessContext}. This ${faker.word.adjective()} project will help you ${learningOutcome} while building a ${faker.hacker.adjective()} real-world application using ${selectedTechNames.join(', ')}.`;
};

const selectTechnologiesForCategory = (
	category: Category,
	allTechnologies: Technology[]
): Technology[] => {
	const categoryTechs =
		TECH_STACKS[category.name as keyof typeof TECH_STACKS] ||
		TECH_STACKS['Web Development'];
	const selectedTechNames = faker.helpers.arrayElements(categoryTechs, {
		min: 3,
		max: 6
	});
	return allTechnologies.filter((tech) =>
		selectedTechNames.includes(tech.name)
	);
};

const generatePreRequisites = (selectedTechNames: string[]): string[] => {
	return faker.helpers.arrayElements(
		[
			`Basic ${faker.helpers.arrayElement(selectedTechNames.slice(0, 2))} knowledge`,
			`Understanding of ${faker.hacker.noun()} development`,
			`Familiarity with ${faker.hacker.adjective()} databases`,
			`${faker.hacker.adjective()} Git version control`,
			`Command line and ${faker.hacker.noun()} basics`,
			`${faker.word.adjective()} HTML/CSS fundamentals`,
			`${faker.hacker.adjective()} JavaScript knowledge`,
			`API and ${faker.hacker.noun()} concepts`,
			`${faker.word.adjective()} software architecture`,
			`${faker.hacker.adjective()} testing methodologies`
		],
		{ min: 2, max: 5 }
	);
};

async function createRelatedEntities(
	prisma: PrismaClient,
	projectTemplate: { id: string },
	difficulty: ProjectDifficultyEnum,
	sprintsByDifficulty: Record<ProjectDifficultyEnum, number>
) {
	const epics = generateEpics(difficulty);
	for (const epicData of epics) {
		await prisma.epic.create({
			data: {
				...epicData,
				projectTemplateId: projectTemplate.id
			}
		});
	}

	const sprints = generateSprints(difficulty);
	sprintsByDifficulty[difficulty] += sprints.length;

	for (const sprintData of sprints) {
		await prisma.sprint.create({
			data: {
				...sprintData,
				projectTemplate: {
					connect: { id: projectTemplate.id }
				}
			}
		});
	}

	const tasks = generateTasks(difficulty);
	const createdSprints = await prisma.sprint.findMany({
		where: { projectTemplate: { id: projectTemplate.id } }
	});
	const createdEpics = await prisma.epic.findMany({
		where: { projectTemplateId: projectTemplate.id }
	});

	for (const taskData of tasks) {
		const sprint = faker.helpers.arrayElement(createdSprints);
		const epic = faker.helpers.maybe(
			() => faker.helpers.arrayElement(createdEpics),
			{ probability: 0.7 }
		);

		await prisma.task.create({
			data: {
				...taskData,
				projectTemplateId: projectTemplate.id,
				sprintId: sprint.id,
				epicId: epic?.id
			}
		});
	}

	return tasks.length;
}

const getCreditsForDifficulty = (
	difficulty: ProjectDifficultyEnum,
	accessType: ProjectAccessTypeEnum
) => {
	if (accessType !== ProjectAccessTypeEnum.CREDITS) {
		return null;
	}

	switch (difficulty) {
		case ProjectDifficultyEnum.BEGINNER:
			return 100;
		case ProjectDifficultyEnum.INTERMEDIATE:
			return 200;
		case ProjectDifficultyEnum.ADVANCED:
			return 300;
		default:
			return 0;
	}
};

export async function createProjectTemplates(
	prisma: PrismaClient,
	categories: Category[],
	technologies: Technology[]
): Promise<TemplateGeneratorResult> {
	const templates: DbProjectTemplate[] = [];
	let totalTasks = 0;
	const sprintsByDifficulty: Record<ProjectDifficultyEnum, number> = {
		[ProjectDifficultyEnum.BEGINNER]: 0,
		[ProjectDifficultyEnum.INTERMEDIATE]: 0,
		[ProjectDifficultyEnum.ADVANCED]: 0
	};

	const TOTAL_TEMPLATES = 55;

	for (let i = 0; i < TOTAL_TEMPLATES; i++) {
		const category = faker.helpers.arrayElement(categories);
		const difficulty = faker.helpers.arrayElement(
			Object.values(ProjectDifficultyEnum)
		);
		const accessType = faker.helpers.arrayElement(
			Object.values(ProjectAccessTypeEnum)
		);
		const methodology = faker.helpers.arrayElement(
			Object.values(ProjectMethodologyEnum)
		);
		const status = faker.helpers.arrayElement(Object.values(ProjectStatusEnum));

		const baseTitle = generateTitle(category.name);
		const title = `${baseTitle} ${i + 1}`;

		const selectedTechs = selectTechnologiesForCategory(category, technologies);
		const selectedTechNames = selectedTechs.map((tech) => tech.name);

		const template = await prisma.projectTemplate.create({
			data: {
				title,
				description: generateTemplateDescription(
					'A comprehensive project',
					selectedTechNames
				),
				methodology,
				minParticipants: faker.number.int({ min: 1, max: 3 }),
				maxParticipants: faker.number.int({ min: 4, max: 8 }),
				credits: getCreditsForDifficulty(difficulty, accessType),
				accessType,
				status,
				difficulty,
				figmaProjectUrl: faker.helpers.maybe(() => faker.internet.url(), {
					probability: 0.3
				}),
				preRequisites: generatePreRequisites(selectedTechNames),
				expectedDuration: faker.helpers.arrayElement([
					`${faker.number.int({ min: 2, max: 4 })} weeks`,
					`${faker.number.int({ min: 1, max: 3 })} month${faker.number.int({ min: 1, max: 3 }) > 1 ? 's' : ''}`,
					`${faker.number.int({ min: 6, max: 12 })} weeks`,
					`${faker.number.int({ min: 2, max: 6 })} months`
				]),
				categoryId: category.id,
				technologies: {
					connect: selectedTechs.map((tech) => ({ id: tech.id }))
				}
			}
		});

		templates.push(template);

		const tasksCreated = await createRelatedEntities(
			prisma,
			template,
			difficulty,
			sprintsByDifficulty
		);
		totalTasks += tasksCreated;

		seedLogger.progress(i + 1, TOTAL_TEMPLATES, 'templates');
	}

	return { templates, totalTasks, sprintsByDifficulty };
}
