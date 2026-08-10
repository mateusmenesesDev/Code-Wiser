export type StatusCountRow = {
	projectId: string | null;
	status: string | null;
	count: number;
};

export type EnrolledProjectStat = {
	totalTasks: number;
	completedTasks: number;
	progress: number;
	lastActivityAt: string | null;
};

export function buildEnrolledProjectStats(input: {
	projectIds: string[];
	statusCounts: StatusCountRow[];
	lastActivityByProjectId: Record<string, Date | null | undefined>;
}): Record<string, EnrolledProjectStat> {
	const totals = new Map<string, { total: number; completed: number }>();

	for (const projectId of input.projectIds) {
		totals.set(projectId, { total: 0, completed: 0 });
	}

	for (const row of input.statusCounts) {
		if (!row.projectId) continue;
		const bucket = totals.get(row.projectId);
		if (!bucket) continue;
		bucket.total += row.count;
		if (row.status === 'DONE') {
			bucket.completed += row.count;
		}
	}

	const stats: Record<string, EnrolledProjectStat> = {};
	for (const projectId of input.projectIds) {
		const bucket = totals.get(projectId) ?? { total: 0, completed: 0 };
		const lastActivity = input.lastActivityByProjectId[projectId];
		stats[projectId] = {
			totalTasks: bucket.total,
			completedTasks: bucket.completed,
			progress:
				bucket.total > 0
					? Math.round((bucket.completed / bucket.total) * 100)
					: 0,
			lastActivityAt: lastActivity ? lastActivity.toISOString() : null
		};
	}

	return stats;
}

/** After Phase 3 aggregation, my-projects is a single enrolled query. */
export function countMyProjectsRoundTrips(_enrolledProjects: number): number {
	return 1;
}
