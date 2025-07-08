import { faker } from '@faker-js/faker';
import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';

export const TASK_TEMPLATES = [
	{
		title: () => `Set up ${faker.hacker.noun()} environment`,
		description: () =>
			`Configure ${faker.hacker.adjective()} development tools, dependencies, and ${faker.word.adjective()} environment setup for optimal ${faker.hacker.noun()} development.`,
		type: TaskTypeEnum.TASK,
		priority: () =>
			faker.helpers.arrayElement([
				TaskPriorityEnum.HIGHEST,
				TaskPriorityEnum.HIGH
			]),
		status: TaskStatusEnum.READY_TO_DEVELOP,
		tags: () =>
			faker.helpers.arrayElements(
				['setup', 'environment', 'configuration', 'development', 'tools'],
				{ min: 2, max: 4 }
			)
	},
	{
		title: () => `Design ${faker.hacker.adjective()} system architecture`,
		description: () =>
			`Plan the overall ${faker.hacker.adjective()} system architecture and ${faker.word.adjective()} technology stack using ${faker.hacker.noun()} patterns.`,
		type: TaskTypeEnum.TASK,
		priority: () =>
			faker.helpers.arrayElement([
				TaskPriorityEnum.HIGH,
				TaskPriorityEnum.MEDIUM
			]),
		status: TaskStatusEnum.BACKLOG,
		tags: () =>
			faker.helpers.arrayElements(
				['architecture', 'design', 'planning', 'system', 'blueprint'],
				{ min: 2, max: 4 }
			)
	},
	{
		title: () => `Create ${faker.hacker.adjective()} database schema`,
		description: () =>
			`Design and implement the ${faker.word.adjective()} database structure with ${faker.hacker.adjective()} relationships and ${faker.hacker.noun()} optimization.`,
		type: TaskTypeEnum.TASK,
		priority: () =>
			faker.helpers.arrayElement([
				TaskPriorityEnum.HIGH,
				TaskPriorityEnum.MEDIUM
			]),
		status: TaskStatusEnum.BACKLOG,
		tags: () =>
			faker.helpers.arrayElements(
				['database', 'schema', 'backend', 'data', 'modeling'],
				{ min: 2, max: 4 }
			)
	}
];

export const INTERMEDIATE_TASKS = [
	{
		title: 'Implement API endpoints',
		description: 'Create RESTful API endpoints for data operations.',
		type: TaskTypeEnum.TASK,
		priority: TaskPriorityEnum.HIGH,
		status: TaskStatusEnum.BACKLOG,
		tags: ['api', 'backend', 'endpoints']
	},
	{
		title: 'Add real-time features',
		description: 'Implement WebSocket connections for real-time updates.',
		type: TaskTypeEnum.TASK,
		priority: TaskPriorityEnum.HIGH,
		status: TaskStatusEnum.BACKLOG,
		tags: ['websockets', 'real-time', 'frontend']
	}
];

export const ADVANCED_TASKS = [
	{
		title: 'Implement caching strategy',
		description: 'Add Redis caching for improved performance.',
		type: TaskTypeEnum.TASK,
		priority: TaskPriorityEnum.HIGH,
		status: TaskStatusEnum.BACKLOG,
		tags: ['caching', 'performance', 'redis']
	},
	{
		title: 'Set up CI/CD pipeline',
		description: 'Configure automated testing and deployment pipeline.',
		type: TaskTypeEnum.TASK,
		priority: TaskPriorityEnum.HIGH,
		status: TaskStatusEnum.BACKLOG,
		tags: ['ci-cd', 'deployment', 'automation']
	}
];

export const COMMON_TASKS = [
	{
		title: 'Write unit tests',
		description: 'Create comprehensive test suite for core functionality.',
		type: TaskTypeEnum.TASK,
		priority: TaskPriorityEnum.MEDIUM,
		status: TaskStatusEnum.BACKLOG,
		tags: ['testing', 'unit-tests', 'quality']
	},
	{
		title: 'Deploy to production',
		description: 'Set up production environment and deploy the application.',
		type: TaskTypeEnum.TASK,
		priority: TaskPriorityEnum.HIGH,
		status: TaskStatusEnum.BACKLOG,
		tags: ['deployment', 'production', 'devops']
	}
];
