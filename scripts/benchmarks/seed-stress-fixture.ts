/**
 * Seeds a reproducible performance stress fixture.
 *
 * Scale defaults match DEFAULT_STRESS_SCALE in src/server/benchmarks/stressFixture.ts
 *
 * Run:
 *   bun run bench:seed
 *   bun run bench:seed -- --templates 5 --tasks 40 --projects 4
 *   bun run bench:seed -- --clean
 */

import { randomUUID } from 'node:crypto';
import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum,
	PrismaClient,
	TaskStatusEnum
} from '@prisma/client';
import {
	DEFAULT_STRESS_SCALE,
	STRESS_TITLE_PREFIX,
	resolveStressScale
} from '../../src/server/benchmarks/stressFixture';

function parseArgs(argv: string[]) {
	const getNumber = (flag: string, fallback: number) => {
		const index = argv.indexOf(flag);
		if (index === -1) return fallback;
		const value = Number(argv[index + 1]);
		return Number.isFinite(value) ? value : fallback;
	};

	return {
		clean: argv.includes('--clean'),
		templates: getNumber('--templates', DEFAULT_STRESS_SCALE.templates),
		tasksPerTemplate: getNumber(
			'--tasks',
			DEFAULT_STRESS_SCALE.tasksPerTemplate
		),
		enrolledProjects: getNumber(
			'--projects',
			DEFAULT_STRESS_SCALE.enrolledProjects
		),
		sprintsPerTemplate: getNumber(
			'--sprints',
			DEFAULT_STRESS_SCALE.sprintsPerTemplate
		),
		epicsPerTemplate: getNumber(
			'--epics',
			DEFAULT_STRESS_SCALE.epicsPerTemplate
		)
	};
}

const STATUSES = Object.values(TaskStatusEnum);

async function cleanStressData(db: PrismaClient) {
	const templates = await db.projectTemplate.findMany({
		where: { title: { startsWith: STRESS_TITLE_PREFIX } },
		select: { id: true }
	});
	const templateIds = templates.map((template) => template.id);

	const projects = await db.project.findMany({
		where: { title: { startsWith: STRESS_TITLE_PREFIX } },
		select: { id: true }
	});
	const projectIds = projects.map((project) => project.id);

	if (templateIds.length > 0 || projectIds.length > 0) {
		await db.task.deleteMany({
			where: {
				OR: [
					{ projectTemplateId: { in: templateIds } },
					{ projectId: { in: projectIds } }
				]
			}
		});
		await db.epic.deleteMany({
			where: {
				OR: [
					{ projectTemplateId: { in: templateIds } },
					{ projectId: { in: projectIds } }
				]
			}
		});
		await db.sprint.deleteMany({
			where: {
				OR: [
					{ projectTemplateId: { in: templateIds } },
					{ projectId: { in: projectIds } }
				]
			}
		});
		await db.projectTemplate.deleteMany({
			where: { id: { in: templateIds } }
		});
		await db.project.deleteMany({ where: { id: { in: projectIds } } });
	}

	await db.category.deleteMany({
		where: { name: `${STRESS_TITLE_PREFIX} Category` }
	});
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const scale = resolveStressScale({
		templates: args.templates,
		tasksPerTemplate: args.tasksPerTemplate,
		enrolledProjects: args.enrolledProjects,
		sprintsPerTemplate: args.sprintsPerTemplate,
		epicsPerTemplate: args.epicsPerTemplate
	});

	const db = new PrismaClient();

	try {
		await cleanStressData(db);
		if (args.clean) {
			console.log('Cleaned stress fixture data.');
			return;
		}

		const category = await db.category.create({
			data: {
				name: `${STRESS_TITLE_PREFIX} Category`,
				approved: true
			}
		});

		for (let t = 0; t < scale.templates; t++) {
			const template = await db.projectTemplate.create({
				data: {
					title: `${STRESS_TITLE_PREFIX} Template ${t + 1}`,
					description: 'Performance stress fixture template',
					methodology: ProjectMethodologyEnum.SCRUM,
					minParticipants: 1,
					maxParticipants: 4,
					credits: 10,
					accessType: ProjectAccessTypeEnum.FREE,
					status: 'APPROVED',
					difficulty: ProjectDifficultyEnum.INTERMEDIATE,
					categoryId: category.id,
					nextTaskNumber: scale.tasksPerTemplate + 1,
					sortOrder: t,
					preRequisites: []
				}
			});

			const sprintIds: string[] = [];
			for (let s = 0; s < scale.sprintsPerTemplate; s++) {
				const id = randomUUID();
				sprintIds.push(id);
				await db.sprint.create({
					data: {
						id,
						title: `Sprint ${s + 1}`,
						projectTemplateId: template.id
					}
				});
			}

			const epicIds: string[] = [];
			for (let e = 0; e < scale.epicsPerTemplate; e++) {
				const id = randomUUID();
				epicIds.push(id);
				await db.epic.create({
					data: {
						id,
						title: `Epic ${e + 1}`,
						projectTemplateId: template.id
					}
				});
			}

			await db.task.createMany({
				data: Array.from({ length: scale.tasksPerTemplate }, (_, i) => ({
					title: `Task ${i + 1}`,
					description: 'Stress fixture task',
					status: STATUSES[i % STATUSES.length],
					order: i,
					publicNumber: i + 1,
					projectTemplateId: template.id,
					sprintId: sprintIds[i % sprintIds.length] ?? null,
					epicId: epicIds[i % epicIds.length] ?? null
				}))
			});
		}

		for (let p = 0; p < scale.enrolledProjects; p++) {
			const project = await db.project.create({
				data: {
					title: `${STRESS_TITLE_PREFIX} Project ${p + 1}`,
					description: 'Performance stress fixture project',
					methodology: ProjectMethodologyEnum.SCRUM,
					minParticipants: 1,
					maxParticipants: 4,
					accessType: ProjectAccessTypeEnum.FREE,
					difficulty: ProjectDifficultyEnum.INTERMEDIATE,
					categoryId: category.id,
					nextTaskNumber: 51,
					publicCode: `PERF_${p + 1}_${randomUUID().slice(0, 6)}`
				}
			});

			await db.task.createMany({
				data: Array.from({ length: 50 }, (_, i) => ({
					title: `Project task ${i + 1}`,
					status: STATUSES[i % STATUSES.length],
					order: i,
					publicNumber: i + 1,
					projectId: project.id
				}))
			});
		}

		console.log(
			JSON.stringify(
				{
					seeded: true,
					scale,
					totals: {
						templates: scale.templates,
						tasks: scale.templates * scale.tasksPerTemplate,
						enrolledProjects: scale.enrolledProjects,
						projectTasks: scale.enrolledProjects * 50
					}
				},
				null,
				2
			)
		);
	} finally {
		await db.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
