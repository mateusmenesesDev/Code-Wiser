import { describe, expect, it } from 'vitest';
import {
	buildEnrolledProjectStats,
	countMyProjectsRoundTrips
} from './enrolledProjectStats';

describe('enrolledProjectStats', () => {
	it('computes progress and last activity per project from aggregates', () => {
		const stats = buildEnrolledProjectStats({
			projectIds: ['p1', 'p2', 'p3'],
			statusCounts: [
				{ projectId: 'p1', status: 'DONE', count: 2 },
				{ projectId: 'p1', status: 'IN_PROGRESS', count: 2 },
				{ projectId: 'p2', status: 'DONE', count: 5 },
				{ projectId: 'p2', status: 'BACKLOG', count: 0 }
			],
			lastActivityByProjectId: {
				p1: new Date('2026-07-01T12:00:00.000Z'),
				p2: new Date('2026-07-02T12:00:00.000Z')
			}
		});

		expect(stats.p1).toEqual({
			totalTasks: 4,
			completedTasks: 2,
			progress: 50,
			lastActivityAt: '2026-07-01T12:00:00.000Z'
		});
		expect(stats.p2).toEqual({
			totalTasks: 5,
			completedTasks: 5,
			progress: 100,
			lastActivityAt: '2026-07-02T12:00:00.000Z'
		});
		expect(stats.p3).toEqual({
			totalTasks: 0,
			completedTasks: 0,
			progress: 0,
			lastActivityAt: null
		});
	});

	it('counts my-projects as a single round-trip after aggregation', () => {
		expect(countMyProjectsRoundTrips(12)).toBe(1);
	});
});
