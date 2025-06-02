import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Creating test project from template...');

	// Find the test template
	const projectTemplate = await prisma.projectTemplate.findUnique({
		where: { slug: 'test-kanban-project' },
		include: {
			sprints: true,
			epics: true,
			tasks: true
		}
	});

	if (!projectTemplate) {
		console.error(
			'❌ Test project template not found. Run npm run db:test-data first.'
		);
		return;
	}

	// Create a test user (if not exists)
	const testUser = await prisma.user.upsert({
		where: { email: 'test@example.com' },
		update: {},
		create: {
			id: 'test-user-id',
			email: 'test@example.com',
			credits: 100
		}
	});

	const {
		id: _templateId,
		status: _status,
		expectedDuration: _expectedDuration,
		credits: _credits,
		sprints: templateSprints,
		epics: templateEpics,
		tasks: templateTasks,
		...projectData
	} = projectTemplate;

	// Create the project
	const newProject = await prisma.project.upsert({
		where: { slug: slugify('Test Kanban Project Instance') },
		update: {},
		create: {
			...projectData,
			title: 'Test Kanban Project Instance',
			slug: slugify('Test Kanban Project Instance'),
			members: { connect: { id: testUser.id } }
		}
	});

	// Create sprints
	const sprintIdMap: Record<string, string> = {};
	for (const sprint of templateSprints) {
		const { id: oldId, projectTemplateSlug, ...sprintData } = sprint;
		const newSprint = await prisma.sprint.create({
			data: {
				...sprintData,
				projectSlug: newProject.slug,
				projectTemplateSlug: null
			}
		});
		sprintIdMap[oldId] = newSprint.id;
	}

	// Create epics
	const epicIdMap: Record<string, string> = {};
	for (const epic of templateEpics) {
		const { id: oldId, projectTemplateId, ...epicData } = epic;
		const newEpic = await prisma.epic.create({
			data: {
				...epicData,
				projectId: newProject.id
			}
		});
		epicIdMap[oldId] = newEpic.id;
	}

	// Create tasks
	for (const task of templateTasks) {
		const {
			id: _taskId,
			epicId,
			sprintId,
			projectTemplateId,
			...taskData
		} = task;
		await prisma.task.upsert({
			where: {
				projectId_title: {
					projectId: newProject.id,
					title: taskData.title
				}
			},
			update: {
				...taskData,
				epicId: epicId ? epicIdMap[epicId] : null,
				sprintId: sprintId ? sprintIdMap[sprintId] : null
			},
			create: {
				...taskData,
				projectId: newProject.id,
				epicId: epicId ? epicIdMap[epicId] : null,
				sprintId: sprintId ? sprintIdMap[sprintId] : null,
				projectTemplateId: null
			}
		});
	}

	console.log('✅ Test project created successfully!');
	console.log(`Project: ${newProject.title} (${newProject.slug})`);
	console.log(`Tasks created: ${templateTasks.length}`);
	console.log('\n🌐 You can now test the kanban board at:');
	console.log(`http://localhost:3000/workspace/${newProject.slug}`);
}

main()
	.catch((e) => {
		console.error('❌ Error creating test project:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
