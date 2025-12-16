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
