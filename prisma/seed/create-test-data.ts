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
	const variations = [
		`${template.prefix} ${category} Platform`,
		`Modern ${template.prefix} System`,
		`Advanced ${template.prefix} Application`,
		`${template.prefix} Management Tool`,
		`Professional ${template.prefix} Solution`,
		`${template.prefix} Hub`,
		`Smart ${template.prefix} Platform`,
		`${template.prefix} Pro`,
		`Next-Gen ${template.prefix}`,
		`${template.prefix} Studio`
	];

	return faker.helpers.arrayElement(variations);
}

function generateTasks(
	_templateType: string,
	difficulty: ProjectDifficultyEnum
) {
	const baseTasks: Array<{
		title: string;
		description: string;
		type: TaskTypeEnum;
		priority: TaskPriorityEnum;
		status: TaskStatusEnum;
		tags: string[];
	}> = [
		{
			title: 'Set up development environment',
			description:
				'Configure development tools, dependencies, and local environment setup.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGHEST,
			status: TaskStatusEnum.READY_TO_DEVELOP,
			tags: ['setup', 'environment', 'configuration']
		},
		{
			title: 'Design system architecture',
			description: 'Plan the overall system architecture and technology stack.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGH,
			status: TaskStatusEnum.BACKLOG,
			tags: ['architecture', 'design', 'planning']
		},
		{
			title: 'Create database schema',
			description:
				'Design and implement the database structure and relationships.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGH,
			status: TaskStatusEnum.BACKLOG,
			tags: ['database', 'schema', 'backend']
		},
		{
			title: 'Implement user authentication',
			description:
				'Build secure user registration, login, and session management.',
			type: TaskTypeEnum.USER_STORY,
			priority: TaskPriorityEnum.HIGH,
			status: TaskStatusEnum.BACKLOG,
			tags: ['auth', 'security', 'user-management']
		}
	];

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
		const title = `${baseTitle} ${faker.string.alphanumeric(6)}`;
		const slug = `${slugify(title, { lower: true, strict: true })}-${faker.string.alphanumeric(4)}`;

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

		const projectTemplate = await prisma.projectTemplate.create({
			data: {
				title,
				slug,
				description: `${template.description} using modern technologies and best practices. This project will help you learn ${selectedTechNames.join(', ')} while building a real-world application.`,
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
						'Basic programming knowledge',
						'Understanding of web development',
						'Familiarity with databases',
						'Git version control',
						'Command line basics',
						'HTML/CSS fundamentals',
						'JavaScript knowledge',
						'API concepts'
					],
					{ min: 2, max: 4 }
				),
				expectedDuration: faker.helpers.arrayElement([
					'2-3 weeks',
					'1 month',
					'6-8 weeks',
					'2-3 months',
					'3-4 months'
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
