import { beforeEach, describe, expect, it } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { applyOrgAdminMembership } from './applyOrgAdminMembership';

describe('applyOrgAdminMembership', () => {
	beforeEach(() => {
		mockDb.user.updateMany.mockResolvedValue({ count: 1 } as never);
	});

	it('updates the user projection for membership create/update', async () => {
		const result = await applyOrgAdminMembership(mockDb, {
			userId: 'user_1',
			role: 'org:admin',
			eventType: 'organizationMembership.created'
		});

		expect(result).toEqual({ updated: true, isOrgAdmin: true });
		expect(mockDb.user.updateMany).toHaveBeenCalledWith({
			where: { id: 'user_1' },
			data: { isOrgAdmin: true }
		});
	});

	it('clears the projection when membership is deleted', async () => {
		await applyOrgAdminMembership(mockDb, {
			userId: 'user_1',
			role: 'org:admin',
			eventType: 'organizationMembership.deleted'
		});

		expect(mockDb.user.updateMany).toHaveBeenCalledWith({
			where: { id: 'user_1' },
			data: { isOrgAdmin: false }
		});
	});
});
