import { describe, expect, it } from 'vitest';
import { isOrgAdminRole, resolveOrgAdminFlag } from './orgAdminSync';

describe('orgAdminSync', () => {
	it('treats org:admin and admin as admin roles', () => {
		expect(isOrgAdminRole('org:admin')).toBe(true);
		expect(isOrgAdminRole('admin')).toBe(true);
		expect(isOrgAdminRole('org:member')).toBe(false);
		expect(isOrgAdminRole(null)).toBe(false);
	});

	it('clears admin flag on membership deleted', () => {
		expect(
			resolveOrgAdminFlag({
				userId: 'user_1',
				role: 'org:admin',
				eventType: 'organizationMembership.deleted'
			})
		).toBe(false);
	});

	it('sets admin flag from created/updated membership role', () => {
		expect(
			resolveOrgAdminFlag({
				userId: 'user_1',
				role: 'org:admin',
				eventType: 'organizationMembership.created'
			})
		).toBe(true);
		expect(
			resolveOrgAdminFlag({
				userId: 'user_1',
				role: 'org:member',
				eventType: 'organizationMembership.updated'
			})
		).toBe(false);
	});

	it('returns null when user id is missing', () => {
		expect(
			resolveOrgAdminFlag({
				userId: undefined,
				role: 'org:admin',
				eventType: 'organizationMembership.created'
			})
		).toBeNull();
	});
});
