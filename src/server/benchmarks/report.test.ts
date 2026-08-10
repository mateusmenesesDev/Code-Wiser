import { describe, expect, it } from 'vitest';
import { runClientBenches } from './clientBenches';
import { buildBenchmarkReport } from './report';
import { DEFAULT_STRESS_SCALE } from './stressFixture';

describe('buildBenchmarkReport', () => {
	it('assembles a serializable baseline report', () => {
		const report = buildBenchmarkReport({
			phase: 'phase-1',
			label: 'baseline',
			scale: DEFAULT_STRESS_SCALE,
			client: runClientBenches({ boardTasks: 20, iterations: 2 }),
			server: { available: false, reason: 'client-only' }
		});

		expect(report.phase).toBe('phase-1');
		expect(report.label).toBe('baseline');
		expect(report.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(report.server.available).toBe(false);
		expect(JSON.parse(JSON.stringify(report)).client.benches.reorderKanban).toBeTruthy();
	});
});
