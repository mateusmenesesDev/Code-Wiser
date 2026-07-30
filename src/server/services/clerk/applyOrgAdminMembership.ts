import type { PrismaClient } from '@prisma/client';
import {
	type OrgMembershipSyncInput,
	resolveOrgAdminFlag
} from './orgAdminSync';

export async function applyOrgAdminMembership(
	db: PrismaClient,
	input: OrgMembershipSyncInput
): Promise<{ updated: boolean; isOrgAdmin: boolean | null }> {
	const isOrgAdmin = resolveOrgAdminFlag(input);
	if (!input.userId || isOrgAdmin === null) {
		return { updated: false, isOrgAdmin };
	}

	const result = await db.user.updateMany({
		where: { id: input.userId },
		data: { isOrgAdmin }
	});

	return { updated: result.count > 0, isOrgAdmin };
}
