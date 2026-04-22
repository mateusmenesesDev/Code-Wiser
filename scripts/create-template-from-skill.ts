/**
 * Persistence script for the generate-template agent skill.
 *
 * Reads scripts/template-wip.json (or a custom path via --input <path>),
 * validates the payload, and writes a complete ProjectTemplate tree to the
 * database inside a single Prisma transaction.
 *
 * Usage:
 *   npx tsx scripts/create-template-from-skill.ts
 *   npx tsx scripts/create-template-from-skill.ts --input /path/to/custom.json
 *   npx tsx scripts/create-template-from-skill.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import type {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum,
	TaskPriorityEnum,
	TaskTypeEnum
} from '@prisma/client';

// ---------------------------------------------------------------------------
// JSON Contract — this is the shape of template-wip.json
// ---------------------------------------------------------------------------

export interface TemplateWipMetadata {
	title: string;
	description: string;
	categoryName: string;
	difficulty: ProjectDifficultyEnum;
	methodology: ProjectMethodologyEnum;
	accessType: ProjectAccessTypeEnum;
	technologies?: string[];
	minParticipants?: number;
	maxParticipants?: number;
}

export interface TemplateWipUserStory {
	title: string;
	description: string;
	acceptanceCriteria: string[];
	type: TaskTypeEnum;
	priority: TaskPriorityEnum;
	tags: string[];
	epicTitle?: string;
	sprintTitle?: string;
}

export interface TemplateWipEpic {
	title: string;
	description: string;
}

export interface TemplateWipSprint {
	title: string;
	description: string;
	order: number;
}

export interface TemplateWip {
	metadata: TemplateWipMetadata;
	userStories: TemplateWipUserStory[];
	epics: TemplateWipEpic[];
	sprints: TemplateWipSprint[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(): { inputPath: string; dryRun: boolean } {
	const args = process.argv.slice(2);
	let inputPath = path.join(process.cwd(), 'scripts', 'template-wip.json');
	let dryRun = false;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--dry-run') {
			dryRun = true;
		} else if (args[i] === '--input' && args[i + 1]) {
			inputPath = path.resolve(args[i + 1]!);
			i++;
		}
	}

	return { inputPath, dryRun };
}

function readWip(inputPath: string): TemplateWip {
	if (!fs.existsSync(inputPath)) {
		console.error(`❌ Input file not found: ${inputPath}`);
		process.exit(1);
	}

	let raw: unknown;
	try {
		raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
	} catch {
		console.error(`❌ Failed to parse JSON from: ${inputPath}`);
		process.exit(1);
	}

	const wip = raw as TemplateWip;

	if (!wip.metadata?.title) {
		console.error('❌ Invalid template-wip.json: missing metadata.title');
		process.exit(1);
	}
	if (!wip.metadata?.categoryName) {
		console.error('❌ Invalid template-wip.json: missing metadata.categoryName');
		process.exit(1);
	}
	if (!Array.isArray(wip.userStories)) {
		console.error('❌ Invalid template-wip.json: userStories must be an array');
		process.exit(1);
	}
	if (!Array.isArray(wip.epics)) {
		console.error('❌ Invalid template-wip.json: epics must be an array');
		process.exit(1);
	}
	if (!Array.isArray(wip.sprints)) {
		console.error('❌ Invalid template-wip.json: sprints must be an array');
		process.exit(1);
	}

	return wip;
}

function buildTaskDescription(story: TemplateWipUserStory): string {
	const criteria = story.acceptanceCriteria
		.map((c, i) => `${i + 1}. ${c}`)
		.join('\n');
	return `${story.description}\n\n**Acceptance Criteria:**\n${criteria}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const { inputPath, dryRun } = parseArgs();
	const wip = readWip(inputPath);

	if (dryRun) {
		console.log('--- DRY RUN: payload that would be inserted ---');
		console.log(JSON.stringify(wip, null, 2));
		console.log('--- END DRY RUN ---');
		process.exit(0);
	}

	const prisma = new PrismaClient();

	try {
		// Check for duplicate title before opening a transaction
		const existing = await prisma.projectTemplate.findUnique({
			where: { title: wip.metadata.title },
			select: { id: true }
		});

		if (existing) {
			console.error(
				`❌ A ProjectTemplate with the title "${wip.metadata.title}" already exists (id: ${existing.id}).` +
					'\n   Rename the template in template-wip.json and try again.'
			);
			process.exit(1);
		}

		// Resolve (or create) Category
		const category = await prisma.category.upsert({
			where: { name: wip.metadata.categoryName },
			create: { name: wip.metadata.categoryName, approved: false },
			update: {}
		});

		// Resolve (or create) Technologies
		const technologyIds: string[] = [];
		for (const techName of wip.metadata.technologies ?? []) {
			const tech = await prisma.technology.upsert({
				where: { name: techName },
				create: { name: techName, approved: false },
				update: {}
			});
			technologyIds.push(tech.id);
		}

		// Run everything inside a single transaction
		const templateId = await prisma.$transaction(async (tx) => {
			// Create the ProjectTemplate
			const template = await tx.projectTemplate.create({
				data: {
					title: wip.metadata.title,
					description: wip.metadata.description,
					categoryId: category.id,
					difficulty: wip.metadata.difficulty,
					methodology: wip.metadata.methodology,
					accessType: wip.metadata.accessType,
					status: 'PENDING',
					minParticipants: wip.metadata.minParticipants ?? 1,
					maxParticipants: wip.metadata.maxParticipants ?? 4,
					technologies: {
						connect: technologyIds.map((id) => ({ id }))
					}
				}
			});

			// Create Epics and build title → id map
			const epicMap = new Map<string, string>();
			for (const epic of wip.epics) {
				const created = await tx.epic.create({
					data: {
						title: epic.title,
						description: epic.description,
						status: 'PLANNED',
						projectTemplateId: template.id
					}
				});
				epicMap.set(epic.title, created.id);
			}

			// Create Sprints and build title → id map
			const sprintMap = new Map<string, string>();
			for (const sprint of wip.sprints) {
				const created = await tx.sprint.create({
					data: {
						title: sprint.title,
						description: sprint.description,
						order: sprint.order,
						status: 'PLANNING',
						projectTemplateId: template.id
					}
				});
				sprintMap.set(sprint.title, created.id);
			}

			// Create Tasks (User Stories)
			for (const story of wip.userStories) {
				const epicId = story.epicTitle ? epicMap.get(story.epicTitle) : undefined;
				const sprintId = story.sprintTitle
					? sprintMap.get(story.sprintTitle)
					: undefined;

				if (story.epicTitle && !epicId) {
					throw new Error(
						`User story "${story.title}" references unknown epic "${story.epicTitle}". ` +
							'Make sure the epic title exists in the epics array.'
					);
				}
				if (story.sprintTitle && !sprintId) {
					throw new Error(
						`User story "${story.title}" references unknown sprint "${story.sprintTitle}". ` +
							'Make sure the sprint title exists in the sprints array.'
					);
				}

				await tx.task.create({
					data: {
						title: story.title,
						description: buildTaskDescription(story),
						type: story.type,
						priority: story.priority,
						tags: story.tags,
						status: 'BACKLOG',
						projectTemplateId: template.id,
						epicId: epicId ?? null,
						sprintId: sprintId ?? null
					}
				});
			}

			return template.id;
		});

		console.log(`✅ ProjectTemplate created successfully.`);
		console.log(`   ID: ${templateId}`);
	} catch (error) {
		console.error('❌ Database error:', error instanceof Error ? error.message : error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
