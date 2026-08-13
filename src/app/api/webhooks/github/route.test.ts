import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';

const { verifySignature } = vi.hoisted(() => ({
	verifySignature: vi.fn()
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/services/github/github', () => ({
	GitHubServiceError: class GitHubServiceError extends Error {},
	verifyGitHubWebhookSignature: verifySignature
}));

import { POST } from './route';

describe('GitHub webhook route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		verifySignature.mockReturnValue(true);
		mockDb.gitHubWebhookEvent.findUnique.mockResolvedValue(null);
		mockDb.gitHubRepository.findFirst.mockResolvedValue({
			id: 'repo-1'
		} as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb as never)
		);
	});

	it('rejects invalid signatures before parsing or writing', async () => {
		verifySignature.mockReturnValue(false);
		const response = await POST(
			new Request('http://localhost/api/webhooks/github', {
				method: 'POST',
				headers: {
					'x-github-delivery': 'delivery-1',
					'x-github-event': 'pull_request',
					'x-hub-signature-256': 'sha256=bad'
				},
				body: '{}'
			})
		);

		expect(response.status).toBe(400);
		expect(mockDb.gitHubWebhookEvent.findUnique).not.toHaveBeenCalled();
	});

	it('syncs pull request metadata and records the delivery atomically', async () => {
		const response = await POST(
			new Request('http://localhost/api/webhooks/github', {
				method: 'POST',
				headers: {
					'x-github-delivery': 'delivery-1',
					'x-github-event': 'pull_request',
					'x-hub-signature-256': 'sha256=valid'
				},
				body: JSON.stringify({
					action: 'synchronize',
					installation: { id: 123 },
					repository: { full_name: 'acme/app' },
					pull_request: {
						number: 42,
						html_url: 'https://github.com/acme/app/pull/42',
						title: 'Improve tests',
						state: 'open',
						merged: false,
						user: { login: 'student' },
						commits: 3,
						head: { sha: 'abc123' }
					}
				})
			})
		);

		expect(response.status).toBe(200);
		expect(mockDb.pullRequestReview.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { githubRepositoryId: 'repo-1', githubPullRequestNumber: 42 },
				data: expect.objectContaining({
					githubTitle: 'Improve tests',
					githubState: 'OPEN',
					githubChecksStatus: 'PENDING'
				})
			})
		);
		expect(mockDb.exerciseReviewSubmission.updateMany).toHaveBeenCalled();
		expect(mockDb.gitHubWebhookEvent.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				id: 'delivery-1',
				event: 'pull_request',
				action: 'synchronize'
			})
		});
	});
});
