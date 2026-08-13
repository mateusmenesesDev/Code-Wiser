import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { githubRouter } from './github.router';

const { listRepositories } = vi.hoisted(() => ({
	listRepositories: vi.fn()
}));

vi.mock('~/server/services/github/github', () => ({
	GitHubServiceError: class GitHubServiceError extends Error {},
	githubAppInstallUrl: () =>
		'https://github.com/apps/codewise/installations/new',
	isGitHubAppConfigured: () => true,
	listInstallationRepositories: listRepositories,
	getPullRequestSnapshot: vi.fn(),
	listPullRequests: vi.fn()
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: null,
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('github router', () => {
	const createCaller = createCallerFactory(githubRouter);

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.project.findUnique.mockResolvedValue({
			memberships: [{ role: 'OWNER', status: 'ACTIVE', joinedAt: new Date() }]
		} as never);
		mockDb.gitHubInstallation.findFirst.mockResolvedValue({
			id: 'installation-1',
			githubInstallationId: '123',
			accountLogin: 'acme',
			accountType: 'Organization'
		} as never);
		mockDb.gitHubRepository.findUnique.mockResolvedValue(null);
		mockDb.gitHubRepository.upsert.mockResolvedValue({
			id: 'repository-1',
			fullName: 'acme/app'
		} as never);
		listRepositories.mockResolvedValue([
			{
				id: 1,
				owner: 'acme',
				name: 'app',
				fullName: 'acme/app',
				htmlUrl: 'https://github.com/acme/app',
				private: true
			}
		]);
	});

	it('only links repositories exposed by the user-owned installation', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.linkProjectRepository({
			projectId: 'project-1',
			installationId: 'installation-1',
			fullName: 'acme/app'
		});

		expect(result).toMatchObject({ id: 'repository-1' });
		expect(mockDb.gitHubRepository.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					installationId_fullName: {
						installationId: 'installation-1',
						fullName: 'acme/app'
					}
				}
			})
		);
	});

	it('rejects repository listing for an installation owned by another user', async () => {
		mockDb.gitHubInstallation.findFirst.mockResolvedValue(null);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.listRepositories({ installationId: 'other-installation' })
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});
});
