/**
 * Script to fix users with null weeklySessionsResetAt dates
 * 
 * Run with: npx tsx scripts/fix-reset-dates.ts
 */

import { db } from '../src/server/db';

async function getNextResetDate(): Promise<Date> {
	const now = new Date();
	const nextMonday = new Date(now);
	nextMonday.setUTCDate(now.getUTCDate() + ((8 - now.getUTCDay()) % 7));
	nextMonday.setUTCHours(0, 0, 0, 0);
	return nextMonday;
}

async function fixResetDates() {
	console.log('🔍 Finding users with null weeklySessionsResetAt...');

	const usersWithNullResetDate = await db.user.findMany({
		where: {
			mentorshipStatus: 'ACTIVE',
			weeklySessionsResetAt: null
		},
		select: {
			id: true,
			email: true,
			weeklyMentorshipSessions: true,
			remainingWeeklySessions: true
		}
	});

	console.log(`📊 Found ${usersWithNullResetDate.length} users to fix`);

	if (usersWithNullResetDate.length === 0) {
		console.log('✅ All users have reset dates set!');
		return;
	}

	const nextReset = await getNextResetDate();
	console.log(`📅 Setting reset date to: ${nextReset.toISOString()}`);

	for (const user of usersWithNullResetDate) {
		console.log(`\n👤 Fixing user: ${user.email} (${user.id})`);
		console.log(`   Weekly sessions: ${user.weeklyMentorshipSessions ?? 1}`);
		console.log(`   Current remaining: ${user.remainingWeeklySessions}`);

		await db.user.update({
			where: { id: user.id },
			data: {
				weeklySessionsResetAt: nextReset,
				remainingWeeklySessions: user.weeklyMentorshipSessions ?? 1
			}
		});

		console.log(`   ✅ Updated!`);
	}

	console.log(`\n🎉 Successfully fixed ${usersWithNullResetDate.length} users!`);
}

fixResetDates()
	.then(() => {
		console.log('\n✨ Done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Error:', error);
		process.exit(1);
	});

