import {
	PrismaClient,
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	TaskPriorityEnum,
	TaskStatusEnum,
	TaskTypeEnum
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Creating test data...');

	// Create a category
	const category = await prisma.category.upsert({
		where: { name: 'Web Development' },
		update: {},
		create: {
			name: 'Web Development',
			approved: true
		}
	});

	// Create a project template
	const projectTemplate = await prisma.projectTemplate.upsert({
		where: { slug: 'test-kanban-project' },
		update: {},
		create: {
			title: 'Test Kanban Project',
			slug: 'test-kanban-project',
			description: 'A test project to demonstrate kanban functionality',
			minParticipants: 1,
			maxParticipants: 5,
			difficulty: ProjectDifficultyEnum.INTERMEDIATE,
			accessType: ProjectAccessTypeEnum.FREE,
			categoryId: category.id
		}
	});

	// Create sample tasks with different statuses
	const tasks = [
		{
			title: 'Set up development environment',
			description:
				'Install Node.js, Postgres and Prisma. Configure development database with proper connections and sample data for testing.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGHEST,
			status: TaskStatusEnum.READY_TO_DEVELOP,
			tags: ['setup', 'development', 'environment']
		},
		{
			title: 'Create user authentication',
			description:
				'Implement user login and registration functionality with proper validation and security measures.',
			type: TaskTypeEnum.USER_STORY,
			priority: TaskPriorityEnum.HIGH,
			status: TaskStatusEnum.READY_TO_DEVELOP,
			tags: ['auth', 'security', 'backend']
		},
		{
			title: 'Design database schema',
			description:
				'Create the database structure for the application including all necessary tables and relationships.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.MEDIUM,
			status: TaskStatusEnum.IN_PROGRESS,
			tags: ['database', 'design', 'schema']
		},
		{
			title: 'Implement API endpoints',
			description:
				'Create REST API endpoints for user management and data operations.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGH,
			status: TaskStatusEnum.IN_PROGRESS,
			tags: ['api', 'backend', 'endpoints']
		},
		{
			title: 'Write unit tests',
			description:
				'Create comprehensive test suite for the application covering all major functionality.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.LOW,
			status: TaskStatusEnum.CODE_REVIEW,
			tags: ['testing', 'quality', 'unit-tests']
		},
		{
			title: 'Deploy to production',
			description:
				'Set up production environment and deploy the application with proper monitoring.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.LOWEST,
			status: TaskStatusEnum.DONE,
			tags: ['deployment', 'production', 'devops']
		}
	];

	for (const taskData of tasks) {
		await prisma.task.upsert({
			where: {
				projectTemplateId_title: {
					projectTemplateId: projectTemplate.id,
					title: taskData.title
				}
			},
			update: taskData,
			create: {
				...taskData,
				projectTemplateId: projectTemplate.id
			}
		});
	}

	console.log('✅ Test data created successfully!');
	console.log(
		`Project template: ${projectTemplate.title} (${projectTemplate.slug})`
	);
	console.log(`Tasks created: ${tasks.length}`);
}

main()
	.catch((e) => {
		console.error('❌ Error creating test data:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
