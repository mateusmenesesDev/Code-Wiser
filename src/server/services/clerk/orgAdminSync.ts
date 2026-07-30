export const ORG_ADMIN_ROLE = 'org:admin';

export function isOrgAdminRole(role: string | null | undefined): boolean {
	return role === ORG_ADMIN_ROLE || role === 'admin';
}

export type OrgMembershipSyncInput = {
	userId: string | null | undefined;
	role: string | null | undefined;
	eventType:
		| 'organizationMembership.created'
		| 'organizationMembership.updated'
		| 'organizationMembership.deleted';
};

export function resolveOrgAdminFlag(
	input: OrgMembershipSyncInput
): boolean | null {
	if (!input.userId) return null;

	if (input.eventType === 'organizationMembership.deleted') {
		return false;
	}

	return isOrgAdminRole(input.role);
}
