import { describe, expect, it } from 'vitest';
import {
	DEFAULT_STRESS_SCALE,
	STRESS_TITLE_PREFIX,
	countMyProjectsRoundTrips,
	createInMemoryStressFixture,
	resolveStressScale
} from './stressFixture';

describe('stressFixture', () => {
	it('resolves documented default scale', () => {
		expect(resolveStressScale()).toEqual(DEFAULT_STRESS_SCALE);
		expect(DEFAULT_STRESS_SCALE).toMatchObject({
			templates: 20,
			tasksPerTemplate: 150,
			enrolledProjects: 12,
			boardTasks: 400
		});
	});

	it('builds an in-memory fixture at the documented scale', () => {
		const fixture = createInMemoryStressFixture();

		expect(fixture.totals.templates).toBe(20);
		expect(fixture.totals.tasks).toBe(20 * 150);
		expect(fixture.totals.enrolledProjects).toBe(12);
		expect(fixture.totals.boardTasks).toBe(400);
		expect(fixture.templates[0]?.title.startsWith(STRESS_TITLE_PREFIX)).toBe(
			true
		);
		expect(fixture.templates[0]?.sprints).toHaveLength(4);
		expect(fixture.templates[0]?.epics).toHaveLength(3);
	});

	it('allows scale overrides for smaller local runs', () => {
		const fixture = createInMemoryStressFixture({
			templates: 2,
			tasksPerTemplate: 5,
			enrolledProjects: 3,
			boardTasks: 10
		});

		expect(fixture.totals).toEqual({
			templates: 2,
			tasks: 10,
			enrolledProjects: 3,
			boardTasks: 10
		});
	});

	it('counts my-projects fan-out round-trips as 1 + 2 per project', () => {
		expect(countMyProjectsRoundTrips(12)).toBe(25);
	});
});
