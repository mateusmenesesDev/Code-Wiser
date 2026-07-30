/**
 * Backfills User.imageUrl from Clerk profile images.
 *
 * Deploy order:
 * 1. Apply migration that adds User.imageUrl
 * 2. Run this backfill (optional but recommended before relying on listAll avatars)
 * 3. Deploy code that reads imageUrl + syncs via user.created / user.updated webhooks
 *
 * Repair if sync drifts:
 *   bun run db:backfill-user-images
 *
 * Dry run:
 *   bun run db:backfill-user-images:dry
 */

import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';

function parseArgs() {
	return { dryRun: process.argv.includes('--dry-run') };
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
			select: { id: true, imageUrl: true }
		});

		let updated = 0;
		let skipped = 0;
		let missing = 0;

		for (const user of users) {
			try {
				const clerkUser = await clerk.users.getUser(user.id);
				const imageUrl = clerkUser.imageUrl || null;
				if (!imageUrl || imageUrl === user.imageUrl) {
					skipped += 1;
					continue;
				}

				if (!dryRun) {
					await db.user.update({
						where: { id: user.id },
						data: { imageUrl }
					});
				}
				updated += 1;
			} catch {
				missing += 1;
			}
		}

		console.log(
			JSON.stringify(
				{
					dryRun,
					total: users.length,
					updated,
					skipped,
					missing
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
	console.error(error);
	process.exit(1);
});
