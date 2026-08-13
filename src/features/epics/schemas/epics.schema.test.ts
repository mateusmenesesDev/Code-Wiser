import { EpicStatusEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { newEpicSchema, updateEpicSchema } from './epics.schema';

describe('epic schemas', () => {
	it('accepts status and a complete date range', () => {
		expect(
			newEpicSchema.parse({
				title: 'Authentication',
				status: EpicStatusEnum.IN_PROGRESS,
				startDate: '2026-08-01',
				endDate: '2026-08-14',
				projectId: 'project-1',
				isTemplate: false
			})
		).toMatchObject({
			status: EpicStatusEnum.IN_PROGRESS,
			startDate: '2026-08-01'
		});
	});

	it('rejects an incomplete or reversed date range', () => {
		expect(() =>
			newEpicSchema.parse({
				title: 'Authentication',
				startDate: '2026-08-14',
				projectId: 'project-1',
				isTemplate: false
			})
		).toThrow('End date is required');

		expect(() =>
			updateEpicSchema.parse({
				id: 'epic-1',
				startDate: '2026-08-14',
				endDate: '2026-08-01'
			})
		).toThrow('End date must be on or after the start date');
	});
});
