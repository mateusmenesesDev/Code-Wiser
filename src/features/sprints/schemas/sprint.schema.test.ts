import { describe, expect, it } from 'vitest';
import { newSprintSchema, updateSprintSchema } from './sprint.schema';

describe('sprint dates', () => {
	it('allows a planning draft without dates', () => {
		const result = newSprintSchema.safeParse({
			title: 'Sprint 1',
			isTemplate: false,
			projectId: 'project-1'
		});

		expect(result.success).toBe(true);
	});

	it('requires both dates when either date is present', () => {
		const result = newSprintSchema.safeParse({
			title: 'Sprint 1',
			isTemplate: false,
			projectId: 'project-1',
			startDate: '2026-01-01'
		});

		expect(result.success).toBe(false);
	});

	it('requires an id when updating', () => {
		const result = updateSprintSchema.safeParse({ title: 'Renamed' });

		expect(result.success).toBe(false);
	});

	it('rejects an end date before the start date', () => {
		const result = updateSprintSchema.safeParse({
			id: 'sprint-1',
			startDate: '2026-01-10',
			endDate: '2026-01-01'
		});

		expect(result.success).toBe(false);
	});
});
