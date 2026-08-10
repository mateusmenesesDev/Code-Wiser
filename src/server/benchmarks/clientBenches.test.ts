import { describe, expect, it } from 'vitest';
import { runClientBenches } from './clientBenches';

describe('runClientBenches', () => {
	it('returns timing summaries for kanban helpers on a stress board', () => {
		const report = runClientBenches({
			boardTasks: 80,
			iterations: 5
		});

		expect(report.scale.boardTasks).toBe(80);
		expect(report.benches.reorderKanban.count).toBe(5);
		expect(report.benches.toKanbanOrderUpdates.count).toBe(5);
		expect(report.benches.groupBySprint.count).toBe(5);
		expect(report.benches.reorderKanban.meanMs).toBeGreaterThanOrEqual(0);
	});
});
