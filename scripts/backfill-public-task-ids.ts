/**
 * Backfills public task identifiers after `prisma db push`.
 *
 * Safe to rerun:
 * - only fills missing ProjectTemplate.publicCode / Project.publicCode
 * - only fills missing Task.publicNumber
 * - recomputes nextTaskNumber from existing + backfilled task numbers
 *
 * Run with:
 *   npx tsx scripts/backfill-public-task-ids.ts --dry-run
 *   npx tsx scripts/backfill-public-task-ids.ts
 */

import { PrismaClient } from '@prisma/client';
import { generatePublicCode } from '../src/lib/publicTaskId';

type Parent = {
	id: string;
	title: string;
	publicCode: string | null;
	nextTaskNumber: number;
};

type Task = {
	id: string;
	projectId: string | null;
	projectTemplateId: string | null;
	publicNumber: number | null;
};

type TaskUpdate = {
	id: string;
	publicNumber: number;
};

type ParentUpdate = {
	id: string;
	nextTaskNumber: number;
};

type CodeUpdate = {
	id: string;
	publicCode: string;
};

function parseArgs() {
	return { dryRun: process.argv.includes('--dry-run') };
}

function reservePublicCode(title: string, usedCodes: Set<string>) {
	const baseCode = generatePublicCode(title);
	let publicCode = baseCode;
	let suffix = 2;

	while (usedCodes.has(publicCode)) {
		publicCode = `${baseCode}_${suffix}`;
		suffix++;
	}

	usedCodes.add(publicCode);
	return publicCode;
}

function planCodeBackfill(parents: Parent[]): CodeUpdate[] {
	const usedCodes = new Set(
		parents
			.map((parent) => parent.publicCode)
			.filter((publicCode): publicCode is string => Boolean(publicCode))
	);

	return parents
		.filter((parent) => !parent.publicCode)
		.map((parent) => ({
			id: parent.id,
			publicCode: reservePublicCode(parent.title, usedCodes)
		}));
}

function nextAvailableNumber(startAt: number, usedNumbers: Set<number>) {
	let candidate = Math.max(1, startAt);
	while (usedNumbers.has(candidate)) candidate++;
	return candidate;
}

function planTaskNumberBackfill(tasks: Task[]) {
	const usedNumbers = new Set<number>();
	const taskUpdates: TaskUpdate[] = [];

	for (const task of tasks) {
		if (task.publicNumber != null) usedNumbers.add(task.publicNumber);
	}

	let visiblePosition = 1;
	for (const task of tasks) {
		if (task.publicNumber == null) {
			const publicNumber = nextAvailableNumber(visiblePosition, usedNumbers);
			usedNumbers.add(publicNumber);
			taskUpdates.push({ id: task.id, publicNumber });
		}
		visiblePosition++;
	}

	const nextTaskNumber =
		usedNumbers.size === 0 ? 1 : Math.max(...usedNumbers.values()) + 1;

	return { taskUpdates, nextTaskNumber };
}

async function main() {
	const { dryRun } = parseArgs();
	const prisma = new PrismaClient();

	try {
		const [templates, projects, templateTasks, projectTasks] = await Promise.all([
			prisma.projectTemplate.findMany({
				orderBy: { id: 'asc' },
				select: { id: true, title: true, publicCode: true, nextTaskNumber: true }
			}),
			prisma.project.findMany({
				orderBy: { id: 'asc' },
				select: { id: true, title: true, publicCode: true, nextTaskNumber: true }
			}),
			prisma.task.findMany({
				where: { projectTemplateId: { not: null } },
				orderBy: [
					{ projectTemplateId: 'asc' },
					{ order: { sort: 'asc', nulls: 'last' } },
					{ createdAt: 'asc' },
					{ id: 'asc' }
				],
				select: {
					id: true,
					projectId: true,
					projectTemplateId: true,
					publicNumber: true
				}
			}),
			prisma.task.findMany({
				where: { projectId: { not: null } },
				orderBy: [
					{ projectId: 'asc' },
					{ order: { sort: 'asc', nulls: 'last' } },
					{ createdAt: 'asc' },
					{ id: 'asc' }
				],
				select: {
					id: true,
					projectId: true,
					projectTemplateId: true,
					publicNumber: true
				}
			})
		]);

		const templateCodeUpdates = planCodeBackfill(templates);
		const projectCodeUpdates = planCodeBackfill(projects);
		const templateTaskUpdates: TaskUpdate[] = [];
		const projectTaskUpdates: TaskUpdate[] = [];
		const templateCounterUpdates: ParentUpdate[] = [];
		const projectCounterUpdates: ParentUpdate[] = [];

		for (const template of templates) {
			const tasks = templateTasks.filter(
				(task) => task.projectTemplateId === template.id
			);
			const { taskUpdates, nextTaskNumber } = planTaskNumberBackfill(tasks);
			const safeNextTaskNumber = Math.max(
				template.nextTaskNumber,
				nextTaskNumber
			);
			templateTaskUpdates.push(...taskUpdates);
			if (template.nextTaskNumber !== safeNextTaskNumber) {
				templateCounterUpdates.push({
					id: template.id,
					nextTaskNumber: safeNextTaskNumber
				});
			}
		}

		for (const project of projects) {
			const tasks = projectTasks.filter((task) => task.projectId === project.id);
			const { taskUpdates, nextTaskNumber } = planTaskNumberBackfill(tasks);
			const safeNextTaskNumber = Math.max(project.nextTaskNumber, nextTaskNumber);
			projectTaskUpdates.push(...taskUpdates);
			if (project.nextTaskNumber !== safeNextTaskNumber) {
				projectCounterUpdates.push({
					id: project.id,
					nextTaskNumber: safeNextTaskNumber
				});
			}
		}

		console.log('Backfill plan:');
		console.log(`  ProjectTemplate.publicCode: ${templateCodeUpdates.length}`);
		console.log(`  Project.publicCode: ${projectCodeUpdates.length}`);
		console.log(`  template Task.publicNumber: ${templateTaskUpdates.length}`);
		console.log(`  project Task.publicNumber: ${projectTaskUpdates.length}`);
		console.log(`  ProjectTemplate.nextTaskNumber: ${templateCounterUpdates.length}`);
		console.log(`  Project.nextTaskNumber: ${projectCounterUpdates.length}`);

		if (dryRun) {
			console.log('\nDry run only. No changes written.');
			return;
		}

		await prisma.$transaction([
			...templateCodeUpdates.map((update) =>
				prisma.projectTemplate.updateMany({
					where: { id: update.id, publicCode: null },
					data: { publicCode: update.publicCode }
				})
			),
			...projectCodeUpdates.map((update) =>
				prisma.project.updateMany({
					where: { id: update.id, publicCode: null },
					data: { publicCode: update.publicCode }
				})
			),
			...templateTaskUpdates.map((update) =>
				prisma.task.updateMany({
					where: { id: update.id, publicNumber: null },
					data: { publicNumber: update.publicNumber }
				})
			),
			...projectTaskUpdates.map((update) =>
				prisma.task.updateMany({
					where: { id: update.id, publicNumber: null },
					data: { publicNumber: update.publicNumber }
				})
			),
			...templateCounterUpdates.map((update) =>
				prisma.projectTemplate.update({
					where: { id: update.id },
					data: { nextTaskNumber: update.nextTaskNumber }
				})
			),
			...projectCounterUpdates.map((update) =>
				prisma.project.update({
					where: { id: update.id },
					data: { nextTaskNumber: update.nextTaskNumber }
				})
			)
		]);

		console.log('\nBackfill complete.');
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error('\nBackfill failed:', error);
	process.exit(1);
});
