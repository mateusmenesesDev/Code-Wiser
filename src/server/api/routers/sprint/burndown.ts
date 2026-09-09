import { SprintStatusEnum } from '@prisma/client';

const toUtcDay = (date: Date) =>
	new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);

const dateKey = (date: Date) => toUtcDay(date).toISOString().slice(0, 10);

const MAX_BURNDOWN_DAYS = 366;

export type BurndownPoint = {
	date: string;
	idealRemaining: number;
	currentPoints: number;
	completedPoints: number;
	remainingPoints: number | null;
	scopeChangeCount: number;
};

export type Burndown = {
	available: boolean;
	truncated: boolean;
	points: BurndownPoint[];
};

export const buildBurndown = (sprint: {
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
	const end = toUtcDay(sprint.completedAt ?? sprint.endDate ?? new Date());
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

	const today = toUtcDay(new Date());
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
			remainingPoints:
				sprint.status === SprintStatusEnum.ACTIVE && day > today
					? null
					: current.remainingPoints,
			scopeChangeCount: changesByDay.get(dateKey(day)) ?? 0
		});
	}

	return {
		available: true,
		truncated: totalDays > MAX_BURNDOWN_DAYS,
		points
	};
};
