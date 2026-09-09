import { SprintStatusEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildBurndown } from '../burndown';

describe('buildBurndown', () => {
	it('keeps the ideal line aligned with the planned end of an active sprint', () => {
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);
		const start = new Date(today);
		start.setUTCDate(start.getUTCDate() - 7);
		const end = new Date(today);
		end.setUTCDate(end.getUTCDate() + 8);
		const result = buildBurndown({
			status: SprintStatusEnum.ACTIVE,
			startedAt: new Date(start.getTime() + 9 * 60 * 60 * 1000),
			startDate: start,
			completedAt: null,
			endDate: end,
			committedPoints: 32,
			snapshots: [
				{
					day: start,
					committedPoints: 32,
					currentPoints: 32,
					completedPoints: 0,
					remainingPoints: 32
				}
			],
			changes: []
		});

		expect(result.points).toHaveLength(16);
		expect(result.points.at(-1)).toMatchObject({
			date: end.toISOString().slice(0, 10),
			idealRemaining: 0,
			remainingPoints: null
		});
	});
});
