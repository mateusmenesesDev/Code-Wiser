import { KanbanColumnTypeEnum, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting database seeding...');

	// Get all project templates that don't have kanban columns yet
	const projectTemplates = await prisma.projectTemplate.findMany({
		include: {
			kanbanColumns: true
		}
	});

	const templatesWithoutColumns = projectTemplates.filter(
		(template) => template.kanbanColumns.length === 0
	);

	console.log(
		`Found ${templatesWithoutColumns.length} project templates without kanban columns`
	);

	// Default kanban columns configuration
	const defaultColumns = [
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

	// Create default columns for each project template
	for (const template of templatesWithoutColumns) {
		console.log(`Creating kanban columns for template: ${template.title}`);

		for (const columnData of defaultColumns) {
			await prisma.kanbanColumn.create({
				data: {
					...columnData,
					projectTemplateId: template.id
				}
			});
		}
	}

	// Get all projects that don't have kanban columns yet
	const projects = await prisma.project.findMany({
		include: {
			kanbanColumns: true
		}
	});

	const projectsWithoutColumns = projects.filter(
		(project) => project.kanbanColumns.length === 0
	);

	console.log(
		`Found ${projectsWithoutColumns.length} projects without kanban columns`
	);

	// Create default columns for each project
	for (const project of projectsWithoutColumns) {
		console.log(`Creating kanban columns for project: ${project.title}`);

		for (const columnData of defaultColumns) {
			await prisma.kanbanColumn.create({
				data: {
					...columnData,
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
