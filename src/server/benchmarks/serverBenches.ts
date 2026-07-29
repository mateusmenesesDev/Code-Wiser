import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import {
	measureAsync,
	measureSync,
	payloadBytes,
	summarizeSamples
} from './measure';
import type { ServerBenchReport } from './report';
import {
	STRESS_TITLE_PREFIX,
	countMyProjectsRoundTrips
} from './stressFixture';

/** Mirrors the current approved-template catalog include (heavy path). */
export const approvedCatalogInclude = {
	category: true,
	technologies: true,
	learningOutcomes: true,
	milestones: true,
	tasks: {
		include: {
			assignee: {
				select: {
					id: true,
					name: true
				}
			},
			sprint: {
				select: {
					id: true,
					title: true
				}
			},
			epic: {
				select: {
					id: true,
					title: true
				}
			}
		},
		orderBy: [{ status: 'asc' as const }, { createdAt: 'asc' as const }]
	},
	images: {
		orderBy: {
			order: 'asc' as const
		},
		select: {
			url: true,
			alt: true
		}
	},
	epics: true,
	sprints: true
};

export async function runServerBenches(
	db: PrismaClient,
	options?: { iterations?: number }
): Promise<ServerBenchReport> {
	const iterations = options?.iterations ?? 5;

	const catalogSamples: number[] = [];
	let catalogPayload = 0;
	let templateCount = 0;
	let taskCount = 0;

	for (let i = 0; i < iterations; i++) {
		const { result, durationMs } = await measureAsync(() =>
			db.projectTemplate.findMany({
				where: {
					status: 'APPROVED',
					title: { startsWith: STRESS_TITLE_PREFIX }
				},
				orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
				include: approvedCatalogInclude
			})
		);
		catalogSamples.push(durationMs);
		if (i === 0) {
			catalogPayload = payloadBytes(result);
			templateCount = result.length;
			taskCount = result.reduce((sum, template) => sum + template.tasks.length, 0);
		}
	}

	const stressProjects = await db.project.findMany({
		where: { title: { startsWith: STRESS_TITLE_PREFIX } },
		select: { id: true },
		take: 50
	});

	const myProjectsSamples: number[] = [];
	for (let i = 0; i < iterations; i++) {
		const { durationMs } = await measureAsync(async () => {
			await db.project.findMany({
				where: { title: { startsWith: STRESS_TITLE_PREFIX } },
				select: { id: true, title: true }
			});
			await Promise.all(
				stressProjects.map(async (project) => {
					await db.task.findMany({
						where: { projectId: project.id },
						select: { status: true }
					});
					await db.task.findFirst({
						where: { projectId: project.id },
						orderBy: { updatedAt: 'desc' },
						select: { updatedAt: true }
					});
				})
			);
		});
		myProjectsSamples.push(durationMs);
	}

	const sourceTemplate = await db.projectTemplate.findFirst({
		where: {
			title: { startsWith: STRESS_TITLE_PREFIX },
			status: 'APPROVED'
		},
		include: {
			tasks: true,
			epics: true,
			sprints: true,
			category: true
		},
		orderBy: { createdAt: 'asc' }
	});

	if (!sourceTemplate) {
		return {
			available: true,
			catalog: {
				latency: summarizeSamples(catalogSamples),
				payloadBytes: catalogPayload,
				templateCount,
				taskCount
			},
			myProjects: {
				enrolledProjects: stressProjects.length,
				roundTrips: countMyProjectsRoundTrips(stressProjects.length),
				latency: summarizeSamples(myProjectsSamples)
			},
			reason: 'No stress template found for clone bench'
		};
	}

	const loadSamples: number[] = [];
	let loadPayload = 0;
	for (let i = 0; i < iterations; i++) {
		const { result, durationMs } = await measureAsync(() =>
			db.projectTemplate.findUniqueOrThrow({
				where: { id: sourceTemplate.id },
				include: {
					tasks: true,
					epics: true,
					sprints: true
				}
			})
		);
		loadSamples.push(durationMs);
		if (i === 0) loadPayload = payloadBytes(result);
	}

	const remapSamples: number[] = [];
	for (let i = 0; i < iterations; i++) {
		const { durationMs } = measureSync(() => {
			const sprintIdMap: Record<string, string> = {};
			const epicIdMap: Record<string, string> = {};
			for (const sprint of sourceTemplate.sprints) {
				sprintIdMap[sprint.id] = randomUUID();
			}
			for (const epic of sourceTemplate.epics) {
				epicIdMap[epic.id] = randomUUID();
			}
			return sourceTemplate.tasks.map((task) => ({
				...task,
				id: randomUUID(),
				epicId: task.epicId ? epicIdMap[task.epicId] : null,
				sprintId: task.sprintId ? sprintIdMap[task.sprintId] : null
			}));
		});
		remapSamples.push(durationMs);
	}

	const cloneSamples: number[] = [];
	for (let i = 0; i < Math.min(iterations, 3); i++) {
		const { durationMs } = await measureAsync(async () => {
			const cloneTitle = `${STRESS_TITLE_PREFIX} Clone Bench ${Date.now()}-${i}`;
			await db.$transaction(async (tx) => {
				const sprintIdMap: Record<string, string> = {};
				const epicIdMap: Record<string, string> = {};

				const cloned = await tx.projectTemplate.create({
					data: {
						title: cloneTitle,
						description: sourceTemplate.description,
						methodology: sourceTemplate.methodology,
						minParticipants: sourceTemplate.minParticipants,
						maxParticipants: sourceTemplate.maxParticipants,
						credits: sourceTemplate.credits,
						accessType: sourceTemplate.accessType,
						status: 'PENDING',
						difficulty: sourceTemplate.difficulty,
						categoryId: sourceTemplate.categoryId,
						nextTaskNumber: sourceTemplate.nextTaskNumber,
						preRequisites: sourceTemplate.preRequisites,
						expectedDuration: sourceTemplate.expectedDuration
					}
				});

				if (sourceTemplate.sprints.length > 0) {
					await tx.sprint.createMany({
						data: sourceTemplate.sprints.map((sprint) => {
							const newId = randomUUID();
							sprintIdMap[sprint.id] = newId;
							return {
								id: newId,
								title: sprint.title,
								description: sprint.description,
								status: sprint.status,
								startDate: sprint.startDate,
								endDate: sprint.endDate,
								projectTemplateId: cloned.id
							};
						})
					});
				}

				if (sourceTemplate.epics.length > 0) {
					await tx.epic.createMany({
						data: sourceTemplate.epics.map((epic) => {
							const newId = randomUUID();
							epicIdMap[epic.id] = newId;
							return {
								id: newId,
								title: epic.title,
								description: epic.description,
								status: epic.status,
								progress: epic.progress,
								startDate: epic.startDate,
								endDate: epic.endDate,
								projectTemplateId: cloned.id
							};
						})
					});
				}

				if (sourceTemplate.tasks.length > 0) {
					await tx.task.createMany({
						data: sourceTemplate.tasks.map((task) => ({
							title: `${task.title}__clone_${i}_${randomUUID().slice(0, 8)}`,
							description: task.description,
							type: task.type,
							tags: task.tags,
							priority: task.priority,
							status: task.status,
							order: task.order,
							storyPoints: task.storyPoints,
							projectTemplateId: cloned.id,
							epicId: task.epicId ? (epicIdMap[task.epicId] ?? null) : null,
							sprintId: task.sprintId
								? (sprintIdMap[task.sprintId] ?? null)
								: null
						}))
					});
				}

				await tx.task.deleteMany({ where: { projectTemplateId: cloned.id } });
				await tx.epic.deleteMany({ where: { projectTemplateId: cloned.id } });
				await tx.sprint.deleteMany({ where: { projectTemplateId: cloned.id } });
				await tx.projectTemplate.delete({ where: { id: cloned.id } });
			});
		});
		cloneSamples.push(durationMs);
	}

	return {
		available: true,
		catalog: {
			latency: summarizeSamples(catalogSamples),
			payloadBytes: catalogPayload,
			templateCount,
			taskCount
		},
		myProjects: {
			enrolledProjects: stressProjects.length,
			roundTrips: countMyProjectsRoundTrips(stressProjects.length),
			latency: summarizeSamples(myProjectsSamples)
		},
		clone: {
			sourceTaskCount: sourceTemplate.tasks.length,
			loadGraph: summarizeSamples(loadSamples),
			loadPayloadBytes: loadPayload,
			inMemoryRemap: summarizeSamples(remapSamples),
			bulkInsertClone: summarizeSamples(cloneSamples)
		}
	};
}
