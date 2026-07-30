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
	approvedCatalogInclude,
	approvedCatalogOrderBy
} from '~/server/api/routers/template/queries/project/approvedCatalogQuery';
import { buildEnrolledProjectStats } from '~/server/api/routers/project/queries/enrolledProjectStats';
import {
	STRESS_TITLE_PREFIX,
	countMyProjectsRoundTrips
} from './stressFixture';

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
				orderBy: approvedCatalogOrderBy,
				include: approvedCatalogInclude
			})
		);
		catalogSamples.push(durationMs);
		if (i === 0) {
			catalogPayload = payloadBytes(result);
			templateCount = result.length;
			taskCount = result.reduce(
				(sum, template) => sum + template._count.tasks,
				0
			);
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
			const projects = await db.project.findMany({
				where: { title: { startsWith: STRESS_TITLE_PREFIX } },
				select: { id: true, title: true }
			});
			const projectIds = projects.map((project) => project.id);
			if (projectIds.length === 0) return;
			await Promise.all([
				db.task.groupBy({
					by: ['projectId', 'status'],
					where: { projectId: { in: projectIds } },
					_count: { _all: true }
				}),
				db.task.groupBy({
					by: ['projectId'],
					where: { projectId: { in: projectIds } },
					_max: { updatedAt: true }
				})
			]);
		});
		myProjectsSamples.push(durationMs);
	}

	const adminSamples: number[] = [];
	let adminLeanPayload = 0;
	let adminHeavyPayload = 0;
	let adminProjectCount = 0;

	for (let i = 0; i < iterations; i++) {
		const { result, durationMs } = await measureAsync(async () => {
			const projects = await db.project.findMany({
				where: {
					canceledAt: null,
					title: { startsWith: STRESS_TITLE_PREFIX }
				},
				take: 20,
				orderBy: { updatedAt: 'desc' },
				include: {
					category: true,
					members: {
						select: { id: true, name: true, email: true }
					}
				}
			});
			const projectIds = projects.map((project) => project.id);
			const statusGroups =
				projectIds.length === 0
					? []
					: await db.task.groupBy({
							by: ['projectId', 'status'],
							where: { projectId: { in: projectIds } },
							_count: { _all: true }
						});
			const stats = buildEnrolledProjectStats({
				projectIds,
				statusCounts: statusGroups.map((row) => ({
					projectId: row.projectId,
					status: row.status,
					count: row._count._all
				})),
				lastActivityByProjectId: {}
			});
			return projects.map((project) => ({
				...project,
				...stats[project.id]
			}));
		});
		adminSamples.push(durationMs);
		if (i === 0) {
			adminLeanPayload = payloadBytes(result);
			adminProjectCount = result.length;
			const heavy = await db.project.findMany({
				where: {
					canceledAt: null,
					title: { startsWith: STRESS_TITLE_PREFIX }
				},
				take: 20,
				orderBy: { updatedAt: 'desc' },
				include: {
					category: true,
					tasks: { select: { id: true, status: true } },
					members: {
						select: { id: true, name: true, email: true }
					}
				}
			});
			adminHeavyPayload = payloadBytes(heavy);
		}
	}

	const adminActiveProjects = {
		projectCount: adminProjectCount,
		leanPayloadBytes: adminLeanPayload,
		heavyPayloadBytes: adminHeavyPayload,
		latency: summarizeSamples(adminSamples)
	};

	const baseReport = {
		available: true as const,
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
		adminActiveProjects
	};

	// Select only columns needed for clone remaps. Avoid full Task scalars so the
	// bench still runs when remote schema lags local (e.g. missing assigneeId).
	const cloneTaskSelect = {
		id: true,
		title: true,
		description: true,
		type: true,
		tags: true,
		priority: true,
		status: true,
		order: true,
		storyPoints: true,
		epicId: true,
		sprintId: true
	} as const;

	let sourceTemplate: Awaited<
		ReturnType<
			typeof db.projectTemplate.findFirst<{
				include: {
					tasks: { select: typeof cloneTaskSelect };
					epics: true;
					sprints: true;
					category: true;
				};
			}>
		>
	> = null;

	try {
		sourceTemplate = await db.projectTemplate.findFirst({
			where: {
				title: { startsWith: STRESS_TITLE_PREFIX },
				status: 'APPROVED'
			},
			include: {
				tasks: { select: cloneTaskSelect },
				epics: true,
				sprints: true,
				category: true
			},
			orderBy: { createdAt: 'asc' }
		});
	} catch (error) {
		return {
			...baseReport,
			reason: `Clone bench skipped: ${error instanceof Error ? error.message : 'unknown error'}`
		};
	}

	if (!sourceTemplate) {
		return {
			...baseReport,
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
					tasks: { select: cloneTaskSelect },
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
		...baseReport,
		clone: {
			sourceTaskCount: sourceTemplate.tasks.length,
			loadGraph: summarizeSamples(loadSamples),
			loadPayloadBytes: loadPayload,
			inMemoryRemap: summarizeSamples(remapSamples),
			bulkInsertClone: summarizeSamples(cloneSamples)
		}
	};
}
