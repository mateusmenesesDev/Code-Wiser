import { describe, expect, it } from 'vitest';
import {
	bucketScheduledBookingsByWeek,
	buildWeekWindows
} from './weeklyBookingCounts';

describe('weeklyBookingCounts', () => {
	it('builds four contiguous week windows from an anchor', () => {
		const weeks = buildWeekWindows(new Date('2026-07-29T12:00:00.000Z'), 4);

		expect(weeks).toHaveLength(4);
		expect(weeks[0]?.weekStart.toISOString()).toBe('2026-07-27T00:00:00.000Z');
		expect(weeks[0]?.weekEnd.toISOString()).toBe('2026-08-03T00:00:00.000Z');
		expect(weeks[3]?.weekStart.toISOString()).toBe('2026-08-17T00:00:00.000Z');
		expect(weeks[3]?.weekEnd.toISOString()).toBe('2026-08-24T00:00:00.000Z');
	});

	it('buckets scheduled bookings into week windows in one pass', () => {
		const weeks = buildWeekWindows(new Date('2026-07-29T12:00:00.000Z'), 4);
		const counts = bucketScheduledBookingsByWeek(
			[
				{ scheduledAt: new Date('2026-07-28T10:00:00.000Z') },
				{ scheduledAt: new Date('2026-07-30T10:00:00.000Z') },
				{ scheduledAt: new Date('2026-08-05T10:00:00.000Z') },
				{ scheduledAt: new Date('2026-09-01T10:00:00.000Z') }
			],
			weeks
		);

		expect(counts.map((week) => week.scheduledCount)).toEqual([2, 1, 0, 0]);
	});
});
