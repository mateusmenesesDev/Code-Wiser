import { describe, expect, it } from 'vitest';
import { githubPullRequestUrlSchema } from './exercise.schema';

describe('githubPullRequestUrlSchema', () => {
	it('accepts and normalizes common PR URL variants', () => {
		expect(
			githubPullRequestUrlSchema.parse(
				'https://github.com/org/repo/pull/12/files'
			)
		).toBe('https://github.com/org/repo/pull/12');
		expect(
			githubPullRequestUrlSchema.parse(
				'https://www.github.com/org/repo/pull/12?diff=unified'
			)
		).toBe('https://github.com/org/repo/pull/12');
		expect(
			githubPullRequestUrlSchema.parse('https://github.com/org/repo/pull/12/')
		).toBe('https://github.com/org/repo/pull/12');
	});

	it('rejects non-PR GitHub URLs', () => {
		expect(() =>
			githubPullRequestUrlSchema.parse('https://github.com/org/repo')
		).toThrow();
		expect(() =>
			githubPullRequestUrlSchema.parse('https://gitlab.com/org/repo/pull/1')
		).toThrow();
	});
});
