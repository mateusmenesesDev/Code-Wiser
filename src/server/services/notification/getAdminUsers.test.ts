import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('@clerk/nextjs/server', () => ({
	clerkClient: {
		users: {
			getOrganizationMembershipList: vi.fn()
		}
	}
}));

describe('getAdminUsers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads admins from the local isOrgAdmin projection without Clerk fan-out', async () => {
		const { clerkClient } = await import('@clerk/nextjs/server');
		const { getAdminUsers } = await import('./base');

		mockDb.user.findMany.mockResolvedValue([
			{
				id: 'admin-1',
				email: 'a@example.com',
				name: 'Ada',
				preferredLocale: 'PT_BR'
			}
		] as never);

		const admins = await getAdminUsers();

		expect(admins).toEqual([
			{
				id: 'admin-1',
				email: 'a@example.com',
				name: 'Ada',
				preferredLocale: 'PT_BR'
			}
		]);
		expect(mockDb.user.findMany).toHaveBeenCalledWith({
			where: { isOrgAdmin: true },
			select: {
				id: true,
				email: true,
				name: true,
				preferredLocale: true
			}
		});
		expect(
			clerkClient.users.getOrganizationMembershipList
		).not.toHaveBeenCalled();
	});
});
