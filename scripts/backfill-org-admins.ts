/**
 * Backfills User.isOrgAdmin from Clerk organization memberships.
 *
 * Deploy order:
 * 1. Apply migration that adds User.isOrgAdmin (default false)
 * 2. Run this backfill (populate admins before cutover traffic relies on the flag)
 * 3. Deploy code that reads isOrgAdmin in getAdminUsers + handles membership webhooks
 * 4. In Clerk Dashboard, ensure the webhook endpoint subscribes to:
 *    organizationMembership.created / updated / deleted
 *
 * Repair if sync drifts:
 *   bun run db:backfill-org-admins
 *
 * Dry run:
 *   bun run db:backfill-org-admins:dry
 */

import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';
import { isOrgAdminRole } from '../src/server/services/clerk/orgAdminSync';

function parseArgs() {
	return { dryRun: process.argv.includes('--dry-run') };
}

async function collectAdminUserIds(
	clerk: ReturnType<typeof createClerkClient>
): Promise<Set<string>> {
	const adminIds = new Set<string>();
	let orgOffset = 0;

	for (;;) {
		const orgs = await clerk.organizations.getOrganizationList({
			limit: 100,
			offset: orgOffset
		});

		for (const org of orgs.data) {
			let memberOffset = 0;
			for (;;) {
				const memberships =
					await clerk.organizations.getOrganizationMembershipList({
						organizationId: org.id,
						limit: 100,
						offset: memberOffset
					});

				for (const membership of memberships.data) {
					const userId = membership.publicUserData?.userId;
					if (userId && isOrgAdminRole(membership.role)) {
						adminIds.add(userId);
					}
				}

				if (memberships.data.length < 100) break;
				memberOffset += memberships.data.length;
			}
		}

		if (orgs.data.length < 100) break;
		orgOffset += orgs.data.length;
	}

	return adminIds;
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
		const adminIds = await collectAdminUserIds(clerk);
		const adminIdList = [...adminIds];

		const existingAdmins = await db.user.findMany({
			where: { id: { in: adminIdList } },
			select: { id: true }
		});
		const existingAdminIds = existingAdmins.map((user) => user.id);

		console.log(
			JSON.stringify(
				{
					dryRun,
					clerkAdminCount: adminIds.size,
					localUsersToMarkAdmin: existingAdminIds.length,
					missingLocalUsers: adminIdList.length - existingAdminIds.length
				},
				null,
				2
			)
		);

		if (dryRun) {
			return;
		}

		await db.$transaction([
			db.user.updateMany({
				where: { isOrgAdmin: true },
				data: { isOrgAdmin: false }
			}),
			...(existingAdminIds.length > 0
				? [
						db.user.updateMany({
							where: { id: { in: existingAdminIds } },
							data: { isOrgAdmin: true }
						})
					]
				: [])
		]);

		console.log(
			JSON.stringify(
				{
					applied: true,
					adminsMarked: existingAdminIds.length
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
