import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createClerkClient } from '@clerk/backend';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { type Page, expect, test as setup } from '@playwright/test';

const authDirectory = path.resolve(process.cwd(), 'playwright/.auth');

const required = (name: string): string => {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing required E2E environment variable: ${name}`);
	}
	return value;
};

const authenticate = async (
	page: Page,
	emailVariable: string,
	idVariable: string,
	stateFile: string
) => {
	const emailAddress = required(emailVariable);
	const expectedUserId = required(idVariable);

	await setupClerkTestingToken({ page });
	await page.goto('/');
	await clerk.signIn({ page, emailAddress });
	const actualUserId = await page.evaluate(
		() =>
			(
				window as Window & {
					Clerk?: { user?: { id?: string | null } | null };
				}
			).Clerk?.user?.id ?? null
	);
	expect(actualUserId).toBe(expectedUserId);

	if (stateFile === 'admin.json') {
		const clerkClient = createClerkClient({
			secretKey: required('CLERK_SECRET_KEY')
		});
		const memberships = await clerkClient.users.getOrganizationMembershipList({
			userId: expectedUserId
		});
		const organizationId = memberships.data[0]?.organization.id;
		if (!organizationId) {
			throw new Error('Administrator has no organization membership');
		}

		const adminMembership = memberships.data.find(
			(membership) => membership.role === 'org:admin'
		);
		if (!adminMembership) {
			await clerkClient.organizations.updateOrganizationMembership({
				organizationId,
				userId: expectedUserId,
				role: 'org:admin'
			});
		}

		await page.evaluate(async (activeOrganizationId) => {
			const clerk = (
				window as Window & {
					Clerk?: {
						setActive: (params: { organization: string }) => Promise<void>;
					};
				}
			).Clerk;
			if (!clerk) throw new Error('Clerk is not loaded');
			await clerk.setActive({ organization: activeOrganizationId });
		}, organizationId);

		await page.waitForFunction(
			(expectedOrganizationId) =>
				(
					window as Window & {
						Clerk?: { organization?: { id?: string | null } };
					}
				).Clerk?.organization?.id === expectedOrganizationId,
			organizationId
		);
	}

	await page.waitForFunction(
		(expectedUserId) =>
			(window as Window & { Clerk?: { user?: { id?: string | null } } }).Clerk
				?.user?.id === expectedUserId,
		expectedUserId
	);

	await mkdir(authDirectory, { recursive: true });
	await page
		.context()
		.storageState({ path: path.join(authDirectory, stateFile) });
};

setup('authenticate student and administrator', async ({ browser, page }) => {
	await authenticate(
		page,
		'E2E_CLERK_USER_EMAIL',
		'E2E_CLERK_USER_ID',
		'user.json'
	);

	const adminContext = await browser.newContext();
	const adminPage = await adminContext.newPage();
	await authenticate(
		adminPage,
		'E2E_CLERK_ADMIN_EMAIL',
		'E2E_CLERK_ADMIN_ID',
		'admin.json'
	);
});
