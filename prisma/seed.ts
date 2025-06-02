import {
	PrismaClient,
	TaskPriorityEnum,
	TaskStatusEnum,
	TaskTypeEnum
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting database seeding...');

	// Get all project templates that don't have tasks yet
	const projectTemplates = await prisma.projectTemplate.findMany({
		include: {
			tasks: true
		}
	});

	const templatesWithoutTasks = projectTemplates.filter(
		(template) => template.tasks.length === 0
	);

	console.log(
		`Found ${templatesWithoutTasks.length} project templates without tasks`
	);

	// Sample tasks for each status
	const sampleTasks = [
		{
			title: 'Set up project structure',
			description:
				'Initialize the project with proper folder structure and dependencies',
			status: TaskStatusEnum.BACKLOG,
			priority: TaskPriorityEnum.HIGH,
			type: TaskTypeEnum.TASK,
			tags: ['setup', 'infrastructure']
		},
		{
			title: 'Design user authentication flow',
			description: 'Create wireframes and user flow for authentication system',
			status: TaskStatusEnum.READY_TO_DEVELOP,
			priority: TaskPriorityEnum.MEDIUM,
			type: TaskTypeEnum.USER_STORY,
			tags: ['design', 'auth']
		},
		{
			title: 'Implement login functionality',
			description: 'Build the login form and authentication logic',
			status: TaskStatusEnum.IN_PROGRESS,
			priority: TaskPriorityEnum.HIGH,
			type: TaskTypeEnum.USER_STORY,
			tags: ['auth', 'frontend']
		},
		{
			title: 'Add password validation',
			description: 'Implement client-side and server-side password validation',
			status: TaskStatusEnum.CODE_REVIEW,
			priority: TaskPriorityEnum.MEDIUM,
			type: TaskTypeEnum.TASK,
			tags: ['validation', 'security']
		},
		{
			title: 'Test user registration',
			description:
				'Write and execute tests for user registration functionality',
			status: TaskStatusEnum.TESTING,
			priority: TaskPriorityEnum.LOW,
			type: TaskTypeEnum.TASK,
			tags: ['testing', 'auth']
		},
		{
			title: 'Setup database schema',
			description: 'Create and migrate database tables for user management',
			status: TaskStatusEnum.DONE,
			priority: TaskPriorityEnum.HIGH,
			type: TaskTypeEnum.TASK,
			tags: ['database', 'migration']
		}
	];

	// Create sample tasks for each project template
	for (const template of templatesWithoutTasks) {
		console.log(`Creating sample tasks for template: ${template.title}`);

		for (const taskData of sampleTasks) {
			await prisma.task.create({
				data: {
					...taskData,
					projectTemplateId: template.id
				}
			});
		}
	}

	// Get all projects that don't have tasks yet
	const projects = await prisma.project.findMany({
		include: {
			tasks: true
		}
	});

	const projectsWithoutTasks = projects.filter(
		(project) => project.tasks.length === 0
	);

	console.log(`Found ${projectsWithoutTasks.length} projects without tasks`);

	// Create sample tasks for each project
	for (const project of projectsWithoutTasks) {
		console.log(`Creating sample tasks for project: ${project.title}`);

		for (const taskData of sampleTasks) {
			await prisma.task.create({
				data: {
					...taskData,
					projectId: project.id
				}
			});
		}
	}

	console.log('✅ Database seeding completed!');
}

main()
	.catch((e) => {
		console.error('❌ Error during seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
