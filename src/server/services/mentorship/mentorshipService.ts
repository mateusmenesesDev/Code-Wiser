import { db } from '~/server/db';

/**
 * Calculate the next Monday at midnight UTC
 */
export function getNextResetDate(): Date {
	const now = new Date();
	const nextMonday = new Date(now);

	// Get days until next Monday (1 = Monday, 0 = Sunday)
	const currentDay = now.getUTCDay();
	const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay;

	nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
	nextMonday.setUTCHours(0, 0, 0, 0);

	return nextMonday;
}

/**
 * Get the start of the current week (Monday at midnight UTC)
 */
export function getCurrentWeekStart(): Date {
	const now = new Date();
	const currentDay = now.getUTCDay();
	const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

	const weekStart = new Date(now);
	weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
	weekStart.setUTCHours(0, 0, 0, 0);

	return weekStart;
}

/**
 * Check if a date is in the current week (Monday to Sunday)
 */
export function isDateInCurrentWeek(date: Date): boolean {
	const weekStart = getCurrentWeekStart();
	const weekEnd = getNextResetDate();

	return date >= weekStart && date < weekEnd;
}

/**
 * Get the week boundaries (start and end) for a given date
 */
export function getWeekBoundaries(date: Date): {
	weekStart: Date;
	weekEnd: Date;
} {
	const targetDate = new Date(date);
	const currentDay = targetDate.getUTCDay();
	const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

	const weekStart = new Date(targetDate);
	weekStart.setUTCDate(targetDate.getUTCDate() - daysFromMonday);
	weekStart.setUTCHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

	return { weekStart, weekEnd };
}

/**
 * Count how many bookings a user has for a specific week
 * Only counts future bookings (not past ones)
 */
export async function countBookingsForWeek(
	userId: string,
	targetDate: Date
): Promise<number> {
	const { weekStart, weekEnd } = getWeekBoundaries(targetDate);
	const now = new Date();

	// Only count bookings that are in the future
	// Past bookings shouldn't count against the weekly limit
	const bookings = await db.mentorshipBooking.count({
		where: {
			userId,
			scheduledAt: {
				gte: weekStart,
				lt: weekEnd,
				gt: now // Only count future bookings
			},
			status: {
				in: ['SCHEDULED']
			}
		}
	});

	return bookings;
}

/**
 * Check if user can book a session for a specific week
 */
export async function canBookForWeek(
	userId: string,
	targetDate: Date
): Promise<{ canBook: boolean; reason?: string; currentCount: number }> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			weeklyMentorshipSessions: true,
			mentorshipStatus: true
		}
	});

	if (!user || user.mentorshipStatus !== 'ACTIVE') {
		return {
			canBook: false,
			reason: 'User does not have active mentorship',
			currentCount: 0
		};
	}

	const currentCount = await countBookingsForWeek(userId, targetDate);
	const maxSessions = user.weeklyMentorshipSessions;

	// Log for debugging
	console.log(
		`[canBookForWeek] User ${userId}: ${currentCount}/${maxSessions} bookings for week starting ${getWeekBoundaries(targetDate).weekStart.toISOString()}`
	);

	if (currentCount >= maxSessions) {
		return {
			canBook: false,
			reason: `You have reached your weekly limit of ${maxSessions} sessions for this week`,
			currentCount
		};
	}

	return {
		canBook: true,
		currentCount
	};
}

/**
 * Decrement weekly sessions count after booking
 */
export async function decrementWeeklySessions(userId: string): Promise<void> {
	await db.user.update({
		where: { id: userId },
		data: {
			remainingWeeklySessions: {
				decrement: 1
			}
		}
	});
}

/**
 * Restore weekly sessions count after cancellation
 */
export async function restoreWeeklySessions(userId: string): Promise<void> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			remainingWeeklySessions: true,
			weeklyMentorshipSessions: true
		}
	});

	if (!user) {
		throw new Error('User not found');
	}

	// Don't exceed the weekly limit
	const newCount = Math.min(
		user.remainingWeeklySessions + 1,
		user.weeklyMentorshipSessions
	);

	await db.user.update({
		where: { id: userId },
		data: {
			remainingWeeklySessions: newCount
		}
	});
}

/**
 * Reset all users' weekly sessions (for cron job)
 */
export async function resetAllWeeklySessions(): Promise<{
	success: boolean;
	count: number;
}> {
	try {
		const nextReset = getNextResetDate();

		// Get all users with active mentorship
		const activeUsers = await db.user.findMany({
			where: { mentorshipStatus: 'ACTIVE' },
			select: { id: true, weeklyMentorshipSessions: true }
		});

		// Update each user individually
		// Note: We can't use updateMany with column references in Prisma
		await Promise.all(
			activeUsers.map((user) =>
				db.user.update({
					where: { id: user.id },
					data: {
						remainingWeeklySessions: user.weeklyMentorshipSessions,
						weeklySessionsResetAt: nextReset
					}
				})
			)
		);

		return {
			success: true,
			count: activeUsers.length
		};
	} catch (error) {
		console.error('Error resetting weekly sessions:', error);
		return {
			success: false,
			count: 0
		};
	}
}

/**
 * Admin manual reset of user's weekly sessions
 */
export async function adminResetUserSessions(userId: string): Promise<void> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { weeklyMentorshipSessions: true }
	});

	if (!user) {
		throw new Error('User not found');
	}

	const nextReset = getNextResetDate();

	await db.user.update({
		where: { id: userId },
		data: {
			remainingWeeklySessions: user.weeklyMentorshipSessions,
			weeklySessionsResetAt: nextReset
		}
	});
}

/**
 * Check if user has active mentorship
 */
export async function hasActiveMentorship(userId: string): Promise<boolean> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { mentorshipStatus: true }
	});

	return user?.mentorshipStatus === 'ACTIVE';
}
