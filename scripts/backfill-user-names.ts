/**
 * Backfills missing User.name values from Clerk profiles.
 *
 * Safe to rerun: existing non-empty local names are preserved.
 *
 * Dry run:
 *   bun run db:backfill-user-names:dry
 */

import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';

function parseArgs() {
	return { dryRun: process.argv.includes('--dry-run') };
}

function getClerkName(user: {
	firstName: string | null;
	lastName: string | null;
	fullName: string | null;
}) {
	const firstAndLastName = [user.firstName, user.lastName]
		.filter(Boolean)
		.join(' ')
		.trim();

	return firstAndLastName || user.fullName?.trim() || null;
}

async function main() {
	const { dryRun } = parseArgs();
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!secretKey) {
		throw new Error('CLERK_SECRET_KEY is required');
	}

	const clerk = createClerkClient({ secretKey });
	const db = new PrismaClient();

	try {
		const users = await db.user.findMany({
			where: { OR: [{ name: null }, { name: '' }] },
			select: { id: true }
		});

		let updated = 0;
		let unresolved = 0;
		let failed = 0;

		for (const user of users) {
			try {
				const clerkUser = await clerk.users.getUser(user.id);
				const name = getClerkName(clerkUser);

				if (!name) {
					unresolved += 1;
					continue;
				}

				if (dryRun) {
					updated += 1;
					continue;
				}

				const result = await db.user.updateMany({
					where: { id: user.id, OR: [{ name: null }, { name: '' }] },
					data: { name }
				});
				updated += result.count;
			} catch {
				failed += 1;
			}
		}

		console.log(
			JSON.stringify(
				{
					dryRun,
					total: users.length,
					updated,
					unresolved,
					failed
				},
				null,
				2
			)
		);
	} finally {
		await db.$disconnect();
	}
}

main().catch((error) => {
	console.error('\nUser name backfill failed:', error);
	process.exit(1);
});
