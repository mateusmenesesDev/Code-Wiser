import { Prisma, SprintStatusEnum, TaskStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import {
	assertProjectResourceAccess,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';

const sprintInclude = Prisma.validator<Prisma.SprintDefaultArgs>()({
	include: {
		tasks: {
			select: {
				id: true,
				title: true,
				publicNumber: true,
				status: true,
				priority: true,
				storyPoints: true,
				order: true,
				sprintId: true,
				project: { select: { publicCode: true } },
				projectTemplate: { select: { publicCode: true } },
				assignees: { select: { id: true, name: true } }
			}
		},
		_count: { select: { changes: true } }
	}
});

type SprintWithStats = Prisma.SprintGetPayload<typeof sprintInclude>;

const addSprintStats = (sprint: SprintWithStats) => {
	const taskCount = sprint.tasks.length;
	const doneCount = sprint.tasks.filter(
		(task) => task.status === TaskStatusEnum.DONE
	).length;
	const currentPoints = sprint.tasks.reduce(
		(sum, task) => sum + (task.storyPoints ?? 0),
		0
	);
	const completedPoints = sprint.tasks.reduce(
		(sum, task) =>
			task.status === TaskStatusEnum.DONE ? sum + (task.storyPoints ?? 0) : sum,
		0
	);
	const remainingPoints = currentPoints - completedPoints;
	const unestimatedTaskCount = sprint.tasks.filter(
		(task) => task.storyPoints === null
	).length;

	return {
		...sprint,
		taskCount,
		doneCount,
		totalPoints: currentPoints,
		currentPoints,
		completedPoints,
		remainingPoints,
		unestimatedTaskCount,
		scopeChangeCount: sprint._count.changes,
		isOverdue:
			sprint.status === SprintStatusEnum.ACTIVE &&
			sprint.endDate !== null &&
			sprint.endDate.getTime() < Date.now()
	};
};

const toUtcDay = (date: Date) =>
	new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);

const dateKey = (date: Date) => toUtcDay(date).toISOString().slice(0, 10);

const MAX_BURNDOWN_DAYS = 366;

type BurndownPoint = {
	date: string;
	idealRemaining: number;
	currentPoints: number;
	completedPoints: number;
	remainingPoints: number;
	scopeChangeCount: number;
};

type Burndown = {
	available: boolean;
	truncated: boolean;
	points: BurndownPoint[];
};

const buildBurndown = (sprint: {
	status: SprintStatusEnum;
	startedAt: Date | null;
	startDate: Date | null;
	completedAt: Date | null;
	endDate: Date | null;
	committedPoints: number | null;
	snapshots: Array<{
		day: Date;
		committedPoints: number | null;
		currentPoints: number;
		completedPoints: number;
		remainingPoints: number;
	}>;
	changes: Array<{ createdAt: Date }>;
}): Burndown => {
	if (
		sprint.status === SprintStatusEnum.PLANNING ||
		sprint.snapshots.length === 0
	) {
		return { available: false, truncated: false, points: [] };
	}
	const firstSnapshot = sprint.snapshots[0];
	if (!firstSnapshot) {
		return { available: false, truncated: false, points: [] };
	}

	const start = toUtcDay(
		sprint.startedAt ?? sprint.startDate ?? firstSnapshot.day
	);
	const end = toUtcDay(
		sprint.completedAt ??
			(sprint.status === SprintStatusEnum.ACTIVE
				? new Date()
				: (sprint.endDate ?? new Date()))
	);
	const totalDays = Math.max(
		1,
		Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
	);
	const dayCount = Math.min(totalDays, MAX_BURNDOWN_DAYS);
	const committedPoints =
		sprint.committedPoints ?? firstSnapshot.committedPoints ?? 0;
	const snapshots = [...sprint.snapshots].sort(
		(first, second) => first.day.getTime() - second.day.getTime()
	);
	const changesByDay = new Map<string, number>();
	for (const change of sprint.changes) {
		const key = dateKey(change.createdAt);
		changesByDay.set(key, (changesByDay.get(key) ?? 0) + 1);
	}

	const points: BurndownPoint[] = [];
	let snapshotIndex = 0;
	let current = snapshots[0] ?? firstSnapshot;

	for (let index = 0; index < dayCount; index += 1) {
		const day = new Date(start.getTime() + index * 86_400_000);
		while (snapshotIndex + 1 < snapshots.length) {
			const nextSnapshot = snapshots[snapshotIndex + 1];
			if (!nextSnapshot || nextSnapshot.day > day) break;
			snapshotIndex += 1;
			current = nextSnapshot;
		}
		const idealRemaining =
			totalDays === 1
				? index === 0
					? committedPoints
					: 0
				: Math.max(0, committedPoints * (1 - index / (totalDays - 1)));
		points.push({
			date: dateKey(day),
			idealRemaining,
			currentPoints: current.currentPoints,
			completedPoints: current.completedPoints,
			remainingPoints: current.remainingPoints,
			scopeChangeCount: changesByDay.get(dateKey(day)) ?? 0
		});
	}

	return {
		available: true,
		truncated: totalDays > MAX_BURNDOWN_DAYS,
		points
	};
};

export const sprintQueries = {
	getAllByProjectId: protectedProcedure
		.input(
			z.object({ projectId: z.string(), isTemplate: z.boolean().optional() })
		)
		.query(async ({ ctx, input }) => {
			const { projectId, isTemplate = false } = input;

			if (isTemplate) {
				await userHasAccessToProjectTemplate(ctx, projectId);
			} else {
				await userHasAccessToProject(ctx, projectId);
			}

			const whereClause = isTemplate
				? { projectTemplate: { id: projectId } }
				: { project: { id: projectId } };
			const sprints = await ctx.db.sprint.findMany({
				where: whereClause,
				...sprintInclude,
				orderBy: { order: 'asc' }
			});

			return sprints.map(addSprintStats);
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const sprint = await ctx.db.sprint.findUnique({
				where: { id: input.id },
				...sprintInclude
			});

			if (!sprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found'
				});
			}

			await assertProjectResourceAccess(ctx, sprint);
			return addSprintStats(sprint);
		}),

	getMetrics: protectedProcedure
		.input(z.object({ projectId: z.string(), sprintId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			await userHasAccessToProject(ctx, input.projectId);

			const selectedSprint = input.sprintId
				? await ctx.db.sprint.findFirst({
						where: { id: input.sprintId, projectId: input.projectId },
						include: {
							tasks: { select: { status: true, storyPoints: true } },
							snapshots: { orderBy: { day: 'asc' } },
							changes: {
								select: { createdAt: true },
								orderBy: { createdAt: 'asc' }
							}
						}
					})
				: null;

			if (input.sprintId && !selectedSprint) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Sprint not found in this project'
				});
			}

			const completedSprints = await ctx.db.sprint.findMany({
				where: {
					projectId: input.projectId,
					status: SprintStatusEnum.COMPLETED
				},
				orderBy: { completedAt: 'desc' },
				take: 5,
				select: {
					id: true,
					title: true,
					completedAt: true,
					snapshots: { orderBy: { day: 'desc' }, take: 1 }
				}
			});
			const velocity = completedSprints.map((sprint) => ({
				id: sprint.id,
				title: sprint.title,
				completedAt: sprint.completedAt,
				points: sprint.snapshots[0]?.completedPoints ?? null,
				available: sprint.snapshots.length > 0
			}));
			const velocityPoints = velocity.flatMap((item) =>
				item.points === null ? [] : [item.points]
			);
			const averageVelocity = velocityPoints.length
				? Math.round(
						(velocityPoints.reduce((sum, points) => sum + points, 0) /
							velocityPoints.length) *
							10
					) / 10
				: null;

			let summary = null;
			let burndown: Burndown = {
				available: false,
				truncated: false,
				points: []
			};
			if (selectedSprint) {
				const latestSnapshot = selectedSprint.snapshots.at(-1);
				const liveCompletedPoints = selectedSprint.tasks.reduce(
					(sum, task) =>
						task.status === TaskStatusEnum.DONE
							? sum + (task.storyPoints ?? 0)
							: sum,
					0
				);
				const liveCurrentPoints = selectedSprint.tasks.reduce(
					(sum, task) => sum + (task.storyPoints ?? 0),
					0
				);
				const isCompleted =
					selectedSprint.status === SprintStatusEnum.COMPLETED;
				const currentPoints = isCompleted
					? (latestSnapshot?.currentPoints ?? liveCurrentPoints)
					: liveCurrentPoints;
				const completedPoints = isCompleted
					? (latestSnapshot?.completedPoints ?? liveCompletedPoints)
					: liveCompletedPoints;
				const taskCount = isCompleted
					? (latestSnapshot?.taskCount ?? selectedSprint.tasks.length)
					: selectedSprint.tasks.length;
				const doneCount = isCompleted
					? (latestSnapshot?.completedTaskCount ??
						selectedSprint.tasks.filter(
							(task) => task.status === TaskStatusEnum.DONE
						).length)
					: selectedSprint.tasks.filter(
							(task) => task.status === TaskStatusEnum.DONE
						).length;
				const unestimatedTaskCount = isCompleted
					? (latestSnapshot?.unestimatedTaskCount ??
						selectedSprint.tasks.filter((task) => task.storyPoints === null)
							.length)
					: selectedSprint.tasks.filter((task) => task.storyPoints === null)
							.length;

				summary = {
					id: selectedSprint.id,
					title: selectedSprint.title,
					status: selectedSprint.status,
					startDate: selectedSprint.startDate,
					endDate: selectedSprint.endDate,
					startedAt: selectedSprint.startedAt,
					completedAt: selectedSprint.completedAt,
					committedPoints: selectedSprint.committedPoints,
					committedTaskCount: selectedSprint.committedTaskCount,
					committedUnestimatedCount: selectedSprint.committedUnestimatedCount,
					currentPoints,
					completedPoints,
					remainingPoints: isCompleted
						? (latestSnapshot?.remainingPoints ??
							currentPoints - completedPoints)
						: currentPoints - completedPoints,
					taskCount,
					doneCount,
					unestimatedTaskCount,
					scopeChangeCount: selectedSprint.changes.length,
					isOverdue:
						selectedSprint.status === SprintStatusEnum.ACTIVE &&
						selectedSprint.endDate !== null &&
						selectedSprint.endDate.getTime() < Date.now()
				};
				burndown = buildBurndown(selectedSprint);
			}

			return {
				summary,
				burndown,
				velocity,
				averageVelocity,
				velocityRange:
					velocityPoints.length > 0
						? {
								min: Math.min(...velocityPoints),
								max: Math.max(...velocityPoints)
							}
						: null
			};
		})
};
