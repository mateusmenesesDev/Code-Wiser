import { faker } from '@faker-js/faker';
import {
	PrismaClient,
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum,
	ProjectStatusEnum,
	TaskPriorityEnum,
	TaskStatusEnum,
	TaskTypeEnum
} from '@prisma/client';
import slugify from 'slugify';
import { checkEnvironment } from './utils/environment';

const prisma = new PrismaClient();

// Predefined categories for realistic data
const CATEGORIES = [
	'Web Development',
	'Mobile Development',
	'Data Science',
	'Machine Learning',
	'DevOps',
	'Backend Development',
	'Frontend Development',
	'Full Stack Development',
	'Game Development',
	'Cybersecurity',
	'Cloud Computing',
	'Blockchain',
	'IoT',
	'AI/ML',
	'UI/UX Design'
];

// Technology stacks by category
const TECH_STACKS = {
	'Web Development': [
		'React',
		'Vue.js',
		'Angular',
		'Next.js',
		'Svelte',
		'HTML',
		'CSS',
		'JavaScript',
		'TypeScript'
	],
	'Mobile Development': [
		'React Native',
		'Flutter',
		'Swift',
		'Kotlin',
		'Ionic',
		'Xamarin'
	],
	'Backend Development': [
		'Node.js',
		'Python',
		'Java',
		'C#',
		'Go',
		'Ruby',
		'PHP',
		'Express.js',
		'Django',
		'Spring Boot'
	],
	'Data Science': [
		'Python',
		'R',
		'Pandas',
		'NumPy',
		'Matplotlib',
		'Jupyter',
		'TensorFlow',
		'PyTorch'
	],
	DevOps: [
		'Docker',
		'Kubernetes',
		'Jenkins',
		'AWS',
		'Azure',
		'GCP',
		'Terraform',
		'Ansible'
	],
	'Game Development': [
		'Unity',
		'Unreal Engine',
		'C#',
		'C++',
		'Godot',
		'Blender'
	],
	Cybersecurity: [
		'Python',
		'Kali Linux',
		'Wireshark',
		'Metasploit',
		'Nmap',
		'Burp Suite'
	],
	'Cloud Computing': [
		'AWS',
		'Azure',
		'GCP',
		'Docker',
		'Kubernetes',
		'Serverless'
	],
	Blockchain: [
		'Solidity',
		'Web3.js',
		'Ethereum',
		'Hardhat',
		'Truffle',
		'React'
	],
	'AI/ML': [
		'Python',
		'TensorFlow',
		'PyTorch',
		'Scikit-learn',
		'OpenCV',
		'Keras'
	]
};

// Project type templates
const PROJECT_TEMPLATES = [
	{
		prefix: 'E-commerce',
		description: 'Build a complete online shopping platform'
	},
	{
		prefix: 'Social Media',
		description: 'Create a social networking application'
	},
	{
		prefix: 'Task Management',
		description: 'Develop a productivity and task tracking system'
	},
	{
		prefix: 'Learning Management',
		description: 'Build an educational platform'
	},
	{
		prefix: 'Portfolio',
		description: 'Create a professional portfolio website'
	},
	{
		prefix: 'Blog',
		description: 'Develop a content management and blogging platform'
	},
	{
		prefix: 'Chat Application',
		description: 'Build a real-time messaging system'
	},
	{
		prefix: 'Weather App',
		description: 'Create a weather forecasting application'
	},
	{
		prefix: 'Finance Tracker',
		description: 'Develop a personal finance management tool'
	},
	{
		prefix: 'Recipe App',
		description: 'Build a cooking and recipe sharing platform'
	},
	{
		prefix: 'Fitness Tracker',
		description: 'Create a health and fitness monitoring app'
	},
	{
		prefix: 'Event Management',
		description: 'Develop an event planning and management system'
	},
	{
		prefix: 'Inventory System',
		description: 'Build a warehouse and inventory management tool'
	},
	{
		prefix: 'Booking System',
		description: 'Create a reservation and booking platform'
	},
	{
		prefix: 'CRM System',
		description: 'Develop a customer relationship management tool'
	}
];

async function createCategories() {
	console.log('📂 Creating categories...');
	const categories = [];

	for (const categoryName of CATEGORIES) {
		const category = await prisma.category.upsert({
			where: { name: categoryName },
			update: {},
			create: {
				name: categoryName,
				approved: true
			}
		});
		categories.push(category);
	}

	return categories;
}

async function createTechnologies() {
	console.log('⚙️ Creating technologies...');
	const technologies = [];
	const allTechs = new Set();

	// Collect all unique technologies
	for (const techs of Object.values(TECH_STACKS)) {
		for (const tech of techs) {
			allTechs.add(tech);
		}
	}

	for (const techName of allTechs) {
		const technology = await prisma.technology.upsert({
			where: { name: techName as string },
			update: {},
			create: {
				name: techName as string,
				approved: true
			}
		});
		technologies.push(technology);
	}

	return technologies;
}

function generateProjectTitle(
	template: (typeof PROJECT_TEMPLATES)[0],
	category: string
) {
	const adjectives = [
		'Modern',
		'Advanced',
		'Smart',
		'Professional',
		'Complete',
		'Comprehensive',
		'Full-Stack',
		'Responsive',
		'Interactive'
	];

	const suffixes = [
		'Platform',
		'System',
		'Application',
		'Tool',
		'Hub',
		'Studio',
		'Manager',
		'Portal',
		'Dashboard'
	];

	const structures = [
		() =>
			`${faker.helpers.arrayElement(adjectives)} ${template.prefix} ${faker.helpers.arrayElement(suffixes)}`,
		() =>
			`${template.prefix} ${faker.helpers.arrayElement(suffixes)} for ${category}`,
		() => `${faker.company.name().split(' ')[0]} ${template.prefix}`,
		() => `${template.prefix} ${faker.helpers.arrayElement(suffixes)}`,
		() => `${faker.helpers.arrayElement(adjectives)} ${template.prefix}`,
		() =>
			`${template.prefix}${faker.helpers.arrayElement(['Pro', 'Plus', 'Max', 'Hub', 'Lab'])}`
	];

	return faker.helpers.arrayElement(structures)();
}

function generateTasks(
	_templateType: string,
	difficulty: ProjectDifficultyEnum
) {
	// Generate dynamic task templates
	const taskTemplates = [
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
		},
		{
			title: () => `Implement ${faker.hacker.adjective()} user authentication`,
			description: () =>
				`Build ${faker.word.adjective()} user registration, login, and session management with ${faker.hacker.adjective()} security measures.`,
			type: TaskTypeEnum.USER_STORY,
			priority: () =>
				faker.helpers.arrayElement([
					TaskPriorityEnum.HIGH,
					TaskPriorityEnum.MEDIUM
				]),
			status: TaskStatusEnum.BACKLOG,
			tags: () =>
				faker.helpers.arrayElements(
					['auth', 'security', 'user-management', 'login', 'registration'],
					{ min: 2, max: 4 }
				)
		},
		{
			title: () => `Develop ${faker.hacker.adjective()} API endpoints`,
			description: () =>
				`Create ${faker.word.adjective()} RESTful API endpoints for ${faker.hacker.noun()} operations with ${faker.hacker.adjective()} validation.`,
			type: TaskTypeEnum.TASK,
			priority: () =>
				faker.helpers.arrayElement([
					TaskPriorityEnum.MEDIUM,
					TaskPriorityEnum.LOW
				]),
			status: TaskStatusEnum.BACKLOG,
			tags: () =>
				faker.helpers.arrayElements(
					['api', 'backend', 'endpoints', 'rest', 'validation'],
					{ min: 2, max: 4 }
				)
		},
		{
			title: () => `Build ${faker.hacker.adjective()} user interface`,
			description: () =>
				`Design and implement ${faker.word.adjective()} user interface components with ${faker.hacker.adjective()} interactions and ${faker.hacker.noun()} optimization.`,
			type: TaskTypeEnum.TASK,
			priority: () =>
				faker.helpers.arrayElement([
					TaskPriorityEnum.MEDIUM,
					TaskPriorityEnum.LOW
				]),
			status: TaskStatusEnum.BACKLOG,
			tags: () =>
				faker.helpers.arrayElements(
					['ui', 'frontend', 'components', 'design', 'ux'],
					{ min: 2, max: 4 }
				)
		},
		{
			title: () => `Implement ${faker.hacker.adjective()} testing suite`,
			description: () =>
				`Create comprehensive ${faker.word.adjective()} test suite covering ${faker.hacker.noun()} functionality with ${faker.hacker.adjective()} coverage.`,
			type: TaskTypeEnum.TASK,
			priority: () =>
				faker.helpers.arrayElement([
					TaskPriorityEnum.MEDIUM,
					TaskPriorityEnum.LOW
				]),
			status: TaskStatusEnum.BACKLOG,
			tags: () =>
				faker.helpers.arrayElements(
					['testing', 'unit-tests', 'quality', 'coverage', 'automation'],
					{ min: 2, max: 4 }
				)
		},
		{
			title: () => `Deploy to ${faker.hacker.adjective()} production`,
			description: () =>
				`Set up ${faker.word.adjective()} production environment and deploy the application with ${faker.hacker.adjective()} monitoring and ${faker.hacker.noun()} optimization.`,
			type: TaskTypeEnum.TASK,
			priority: () =>
				faker.helpers.arrayElement([
					TaskPriorityEnum.LOW,
					TaskPriorityEnum.LOWEST
				]),
			status: TaskStatusEnum.BACKLOG,
			tags: () =>
				faker.helpers.arrayElements(
					[
						'deployment',
						'production',
						'devops',
						'monitoring',
						'infrastructure'
					],
					{ min: 2, max: 4 }
				)
		}
	];

	// Generate base tasks with dynamic content
	const baseTasks: Array<{
		title: string;
		description: string;
		type: TaskTypeEnum;
		priority: TaskPriorityEnum;
		status: TaskStatusEnum;
		tags: string[];
	}> = faker.helpers
		.arrayElements(taskTemplates, { min: 4, max: 6 })
		.map((template) => ({
			title: template.title(),
			description: template.description(),
			type: template.type,
			priority: template.priority(),
			status: template.status,
			tags: template.tags()
		}));

	// Add difficulty-specific tasks
	if (
		difficulty === ProjectDifficultyEnum.INTERMEDIATE ||
		difficulty === ProjectDifficultyEnum.ADVANCED
	) {
		baseTasks.push(
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
		);
	}

	if (difficulty === ProjectDifficultyEnum.ADVANCED) {
		baseTasks.push(
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
		);
	}

	// Add testing tasks
	baseTasks.push(
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
	);

	return baseTasks;
}

interface Category {
	id: string;
	name: string;
}

interface Technology {
	id: string;
	name: string;
}

async function createProjectTemplates(
	categories: Category[],
	technologies: Technology[]
) {
	console.log('🏗️ Creating 50+ project templates...');

	const templates = [];

	for (let i = 0; i < 55; i++) {
		const category = faker.helpers.arrayElement(categories);
		const template = faker.helpers.arrayElement(PROJECT_TEMPLATES);
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

		const baseTitle = generateProjectTitle(template, category.name);
		const title = `${baseTitle} ${i + 1}`;
		const slug = slugify(title, { lower: true });

		// Get relevant technologies for this category
		const categoryTechs =
			TECH_STACKS[category.name as keyof typeof TECH_STACKS] ||
			TECH_STACKS['Web Development'];
		const selectedTechNames = faker.helpers.arrayElements(categoryTechs, {
			min: 3,
			max: 6
		});
		const selectedTechs = technologies.filter((tech) =>
			selectedTechNames.includes(tech.name)
		);

		// Generate dynamic description with business context
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

		const projectTemplate = await prisma.projectTemplate.create({
			data: {
				title,
				slug,
				description: `${template.description} ${businessContext}. This ${faker.word.adjective()} project will help you ${learningOutcome} while building a ${faker.hacker.adjective()} real-world application using ${selectedTechNames.join(', ')}.`,
				methodology,
				minParticipants: faker.number.int({ min: 1, max: 3 }),
				maxParticipants: faker.number.int({ min: 4, max: 8 }),
				credits:
					accessType === ProjectAccessTypeEnum.CREDITS
						? faker.number.int({ min: 10, max: 50 })
						: null,
				accessType,
				status,
				difficulty,
				figmaProjectUrl: faker.helpers.maybe(() => faker.internet.url(), {
					probability: 0.3
				}),
				preRequisites: faker.helpers.arrayElements(
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
				),
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

		// Create tasks for this template
		const tasks = generateTasks(template.prefix, difficulty);
		for (const taskData of tasks) {
			await prisma.task.create({
				data: {
					...taskData,
					projectTemplateId: projectTemplate.id
				}
			});
		}

		templates.push(projectTemplate);

		if ((i + 1) % 10 === 0) {
			console.log(`✅ Created ${i + 1} templates...`);
		}
	}

	return templates;
}

async function main() {
	// Check environment safety first
	checkEnvironment();

	console.log('🌱 Creating comprehensive test data with Faker.js...');

	try {
		// Create categories
		const categories = await createCategories();
		console.log(`✅ Created ${categories.length} categories`);

		// Create technologies
		const technologies = await createTechnologies();
		console.log(`✅ Created ${technologies.length} technologies`);

		// Create project templates with tasks
		const templates = await createProjectTemplates(categories, technologies);
		console.log(`✅ Created ${templates.length} project templates`);

		console.log('\n🎉 Test data creation completed successfully!');
		console.log('📊 Summary:');
		console.log(`   - Categories: ${categories.length}`);
		console.log(`   - Technologies: ${technologies.length}`);
		console.log(`   - Project Templates: ${templates.length}`);
		console.log(
			`   - Tasks: ~${templates.length * 8} (average 8 per template)`
		);
	} catch (error) {
		console.error('❌ Error creating test data:', error);
		throw error;
	}
}

main()
	.catch((e) => {
		console.error('❌ Fatal error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
