import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/env', () => ({
	env: {
		GITHUB_APP_STATE_SECRET: 'state-secret',
		GITHUB_WEBHOOK_SECRET: 'webhook-secret'
	}
}));

import {
	createGitHubInstallState,
	githubPullRequestRefFromUrl,
	verifyGitHubInstallState,
	verifyGitHubWebhookSignature
} from './github';

describe('GitHub integration helpers', () => {
	it('normalizes pull request URLs and rejects other GitHub paths', () => {
		expect(
			githubPullRequestRefFromUrl(
				'https://www.github.com/acme/app/pull/42/files?diff=split'
			)
		).toEqual({
			owner: 'acme',
			repo: 'app',
			number: 42,
			url: 'https://github.com/acme/app/pull/42'
		});
		expect(
			githubPullRequestRefFromUrl('https://github.com/acme/app')
		).toBeNull();
		expect(
			githubPullRequestRefFromUrl('https://gitlab.com/acme/app/pull/42')
		).toBeNull();
	});

	it('signs and verifies installation state', () => {
		const state = createGitHubInstallState('user-1', '/workspace/project-1');
		expect(verifyGitHubInstallState(state)).toEqual({
			userId: 'user-1',
			returnTo: '/workspace/project-1'
		});
		expect(() => verifyGitHubInstallState(`${state}tampered`)).toThrow(
			'Invalid GitHub installation state'
		);
	});

	it('verifies the raw webhook body with HMAC-SHA256', () => {
		const body = '{"action":"opened"}';
		const signature = createHmac('sha256', 'webhook-secret')
			.update(body)
			.digest('hex');
		expect(verifyGitHubWebhookSignature(body, `sha256=${signature}`)).toBe(
			true
		);
		expect(verifyGitHubWebhookSignature(body, 'sha256=bad')).toBe(false);
	});
});
