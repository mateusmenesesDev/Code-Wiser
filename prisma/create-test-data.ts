import {
	KanbanColumnTypeEnum,
	PrismaClient,
	ProjectDifficultyEnum,
	ProjectTypeEnum,
	TaskPriorityEnum,
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
			type: ProjectTypeEnum.FREE,
			categoryId: category.id
		}
	});

	// Create kanban columns
	const columns = [
		{
			title: 'Ready to Develop',
			description: 'Tasks that are ready to be worked on',
			color: 'bg-muted/30',
			position: 0,
			columnType: KanbanColumnTypeEnum.READY_TO_DEVELOP
		},
		{
			title: 'In Progress',
			description: 'Tasks currently being worked on',
			color: 'bg-blue-100/50 dark:bg-blue-900/20',
			position: 1,
			columnType: KanbanColumnTypeEnum.IN_PROGRESS
		},
		{
			title: 'Code Review',
			description: 'Tasks waiting for code review',
			color: 'bg-yellow-100/50 dark:bg-yellow-900/20',
			position: 2,
			columnType: KanbanColumnTypeEnum.CODE_REVIEW
		},
		{
			title: 'Testing',
			description: 'Tasks in testing phase',
			color: 'bg-purple-100/50 dark:bg-purple-900/20',
			position: 3,
			columnType: KanbanColumnTypeEnum.TESTING
		},
		{
			title: 'Done',
			description: 'Completed tasks',
			color: 'bg-green-100/50 dark:bg-green-900/20',
			position: 4,
			columnType: KanbanColumnTypeEnum.DONE
		}
	];

	const createdColumns = [];
	for (const columnData of columns) {
		const column = await prisma.kanbanColumn.upsert({
			where: {
				projectTemplateId_position: {
					projectTemplateId: projectTemplate.id,
					position: columnData.position
				}
			},
			update: columnData,
			create: {
				...columnData,
				projectTemplateId: projectTemplate.id
			}
		});
		createdColumns.push(column);
	}

	// Create sample tasks
	const tasks = [
		{
			title: 'Set up development environment',
			description:
				'Install Node.js, Postgres and Prisma. Configure development database with proper connections and sample data for testing.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGHEST,
			tags: ['setup', 'development', 'environment'],
			kanbanColumnId: createdColumns[0]?.id, // Ready to Develop
			orderInColumn: 0
		},
		{
			title: 'Create user authentication',
			description:
				'Implement user login and registration functionality with proper validation and security measures.',
			type: TaskTypeEnum.USER_STORY,
			priority: TaskPriorityEnum.HIGH,
			tags: ['auth', 'security', 'backend'],
			kanbanColumnId: createdColumns[0]?.id, // Ready to Develop
			orderInColumn: 1
		},
		{
			title: 'Design database schema',
			description:
				'Create the database structure for the application including all necessary tables and relationships.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.MEDIUM,
			tags: ['database', 'design', 'schema'],
			kanbanColumnId: createdColumns[1]?.id, // In Progress
			orderInColumn: 0
		},
		{
			title: 'Implement API endpoints',
			description:
				'Create REST API endpoints for user management and data operations.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.HIGH,
			tags: ['api', 'backend', 'endpoints'],
			kanbanColumnId: createdColumns[1]?.id, // In Progress
			orderInColumn: 1
		},
		{
			title: 'Write unit tests',
			description:
				'Create comprehensive test suite for the application covering all major functionality.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.LOW,
			tags: ['testing', 'quality', 'unit-tests'],
			kanbanColumnId: createdColumns[2]?.id, // Code Review
			orderInColumn: 0
		},
		{
			title: 'Deploy to production',
			description:
				'Set up production environment and deploy the application with proper monitoring.',
			type: TaskTypeEnum.TASK,
			priority: TaskPriorityEnum.LOWEST,
			tags: ['deployment', 'production', 'devops'],
			kanbanColumnId: createdColumns[4]?.id, // Done
			orderInColumn: 0
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
	console.log(`Columns created: ${createdColumns.length}`);
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
