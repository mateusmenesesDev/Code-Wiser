import { getWeekBoundaries } from './mentorshipService';

export function buildWeekWindows(
	now: Date,
	weekCount = 4
): Array<{ weekStart: Date; weekEnd: Date }> {
	return Array.from({ length: weekCount }, (_, weekOffset) => {
		const weekAnchor = new Date(now);
		weekAnchor.setUTCDate(now.getUTCDate() + weekOffset * 7);
		return getWeekBoundaries(weekAnchor);
	});
}

export function bucketScheduledBookingsByWeek(
	bookings: Array<{ scheduledAt: Date }>,
	weeks: Array<{ weekStart: Date; weekEnd: Date }>
): Array<{ weekStart: Date; scheduledCount: number }> {
	const counts = weeks.map(() => 0);

	for (const booking of bookings) {
		for (let index = 0; index < weeks.length; index++) {
			const week = weeks[index];
			if (!week) continue;
			if (
				booking.scheduledAt >= week.weekStart &&
				booking.scheduledAt < week.weekEnd
			) {
				counts[index] = (counts[index] ?? 0) + 1;
				break;
			}
		}
	}

	return weeks.map((week, index) => ({
		weekStart: week.weekStart,
		scheduledCount: counts[index] ?? 0
	}));
}
