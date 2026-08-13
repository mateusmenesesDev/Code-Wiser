import {
	createHmac,
	createSign,
	randomBytes,
	timingSafeEqual
} from 'node:crypto';
import { env } from '~/env';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const MAX_RESPONSE_BYTES = 5_000_000;
const REQUEST_TIMEOUT_MS = 10_000;

type GitHubConfig = {
	appId: string;
	appSlug: string;
	clientId: string;
	clientSecret: string;
	privateKey: string;
	webhookSecret: string;
	stateSecret: string;
};

export type GitHubRepositorySummary = {
	id: number;
	owner: string;
	name: string;
	fullName: string;
	htmlUrl: string;
	private: boolean;
};

export type GitHubPullRequestSnapshot = {
	number: number;
	htmlUrl: string;
	title: string;
	state: string;
	authorLogin: string | null;
	commitCount: number;
	headSha: string;
	checksStatus: string;
};

export type GitHubPullRequestFile = {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	changes: number;
	patch: string | null;
};

export class GitHubServiceError extends Error {
	readonly status: number | undefined;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'GitHubServiceError';
		this.status = status;
	}
}

function configuredValues(): Partial<GitHubConfig> {
	return {
		appId: env.GITHUB_APP_ID,
		appSlug: env.GITHUB_APP_SLUG,
		clientId: env.GITHUB_APP_CLIENT_ID,
		clientSecret: env.GITHUB_APP_CLIENT_SECRET,
		privateKey: env.GITHUB_APP_PRIVATE_KEY,
		webhookSecret: env.GITHUB_WEBHOOK_SECRET,
		stateSecret: env.GITHUB_APP_STATE_SECRET
	};
}

function requireConfig(keys: (keyof GitHubConfig)[]): GitHubConfig {
	const values = configuredValues();
	const missing = keys.filter((key) => !values[key]);
	if (missing.length > 0) {
		throw new GitHubServiceError(
			`GitHub integration is not configured: missing ${missing.join(', ')}`
		);
	}

	return values as GitHubConfig;
}

function toBase64Url(value: string): string {
	return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string): string {
	return Buffer.from(value, 'base64url').toString('utf8');
}

export function createGitHubInstallState(
	userId: string,
	returnTo: string
): string {
	const config = requireConfig(['stateSecret']);
	const payload = toBase64Url(
		JSON.stringify({
			userId,
			returnTo,
			expiresAt: Date.now() + 10 * 60 * 1000,
			nonce: randomBytes(16).toString('hex')
		})
	);
	const signature = createHmac('sha256', config.stateSecret)
		.update(payload)
		.digest('base64url');
	return `${payload}.${signature}`;
}

export function verifyGitHubInstallState(state: string): {
	userId: string;
	returnTo: string;
} {
	const config = requireConfig(['stateSecret']);
	const [payload, signature] = state.split('.');
	if (!payload || !signature) {
		throw new GitHubServiceError('Invalid GitHub installation state');
	}

	const expectedSignature = createHmac('sha256', config.stateSecret)
		.update(payload)
		.digest('base64url');
	const signatureBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expectedSignature);
	if (
		signatureBuffer.length !== expectedBuffer.length ||
		!timingSafeEqual(signatureBuffer, expectedBuffer)
	) {
		throw new GitHubServiceError('Invalid GitHub installation state');
	}

	let parsed: { userId?: unknown; returnTo?: unknown; expiresAt?: unknown };
	try {
		parsed = JSON.parse(fromBase64Url(payload)) as typeof parsed;
	} catch {
		throw new GitHubServiceError('Invalid GitHub installation state');
	}

	if (
		typeof parsed.userId !== 'string' ||
		typeof parsed.returnTo !== 'string' ||
		typeof parsed.expiresAt !== 'number' ||
		parsed.expiresAt < Date.now()
	) {
		throw new GitHubServiceError(
			'Expired or invalid GitHub installation state'
		);
	}

	return { userId: parsed.userId, returnTo: parsed.returnTo };
}

function createAppJwt(): string {
	const config = requireConfig(['appId', 'privateKey']);
	const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const payload = toBase64Url(
		JSON.stringify({
			iat: Math.floor(Date.now() / 1000) - 60,
			exp: Math.floor(Date.now() / 1000) + 9 * 60,
			iss: config.appId
		})
	);
	const unsignedToken = `${header}.${payload}`;
	const signer = createSign('RSA-SHA256');
	signer.update(unsignedToken);
	const signature = signer
		.sign(config.privateKey.replace(/\\n/g, '\n'))
		.toString('base64url');
	return `${unsignedToken}.${signature}`;
}

async function githubRequest<T>(
	path: string,
	options: {
		method?: 'GET' | 'POST';
		token: string;
		body?: Record<string, string>;
	}
): Promise<T> {
	const response = await fetch(`${GITHUB_API_URL}${path}`, {
		method: options.method ?? 'GET',
		headers: {
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': GITHUB_API_VERSION,
			Authorization: `Bearer ${options.token}`,
			...(options.body ? { 'Content-Type': 'application/json' } : {})
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});

	const text = await response.text();
	if (text.length > MAX_RESPONSE_BYTES) {
		throw new GitHubServiceError('GitHub response exceeded the supported size');
	}

	let body: unknown = null;
	if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			throw new GitHubServiceError('GitHub returned an invalid response');
		}
	}

	if (!response.ok) {
		const message =
			typeof body === 'object' && body !== null && 'message' in body
				? String(body.message)
				: 'GitHub request failed';
		throw new GitHubServiceError(message, response.status);
	}

	return body as T;
}

export async function exchangeGitHubCode(code: string): Promise<string> {
	const config = requireConfig(['clientId', 'clientSecret']);
	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	const body = (await response.json()) as {
		access_token?: string;
		error_description?: string;
	};
	if (!response.ok || !body.access_token) {
		throw new GitHubServiceError(
			body.error_description ?? 'GitHub authorization failed',
			response.status
		);
	}
	return body.access_token;
}

export async function verifyGitHubUserInstallation(
	userToken: string,
	installationId: string
): Promise<{ id: string; accountLogin: string; accountType: string }> {
	const body = await githubRequest<{
		id: number;
		account?: { login?: string; type?: string };
	}>(`/user/installations/${encodeURIComponent(installationId)}`, {
		token: userToken
	});
	if (!body.account?.login || !body.account.type) {
		throw new GitHubServiceError('GitHub installation has no account details');
	}
	return {
		id: String(body.id),
		accountLogin: body.account.login,
		accountType: body.account.type
	};
}

export async function getInstallationAccessToken(
	githubInstallationId: string
): Promise<string> {
	const body = await githubRequest<{ token?: string }>(
		`/app/installations/${encodeURIComponent(githubInstallationId)}/access_tokens`,
		{ method: 'POST', token: createAppJwt() }
	);
	if (!body.token) {
		throw new GitHubServiceError('GitHub did not issue an installation token');
	}
	return body.token;
}

export async function listInstallationRepositories(
	githubInstallationId: string
): Promise<GitHubRepositorySummary[]> {
	const token = await getInstallationAccessToken(githubInstallationId);
	const body = await githubRequest<{
		repositories?: Array<{
			id: number;
			name: string;
			full_name: string;
			html_url: string;
			private: boolean;
			owner?: { login?: string };
		}>;
	}>('/installation/repositories?per_page=100', { token });
	return (body.repositories ?? []).flatMap((repository) => {
		if (!repository.owner?.login) return [];
		return [
			{
				id: repository.id,
				owner: repository.owner.login,
				name: repository.name,
				fullName: repository.full_name,
				htmlUrl: repository.html_url,
				private: repository.private
			}
		];
	});
}

async function getCheckStatus(
	token: string,
	owner: string,
	repo: string,
	ref: string
): Promise<string> {
	const body = await githubRequest<{
		check_runs?: Array<{ status?: string; conclusion?: string | null }>;
	}>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(ref)}/check-runs?per_page=100`,
		{ token }
	);
	const runs = body.check_runs ?? [];
	if (runs.length === 0) return 'NONE';
	if (runs.some((run) => run.status !== 'completed')) return 'PENDING';
	if (
		runs.some((run) =>
			[
				'failure',
				'cancelled',
				'timed_out',
				'action_required',
				'stale'
			].includes(run.conclusion ?? '')
		)
	) {
		return 'FAILURE';
	}
	return 'SUCCESS';
}

export async function getPullRequestSnapshot(
	githubInstallationId: string,
	owner: string,
	repo: string,
	number: number
): Promise<GitHubPullRequestSnapshot> {
	const token = await getInstallationAccessToken(githubInstallationId);
	const pullRequest = await githubRequest<{
		number: number;
		html_url: string;
		title: string;
		state: string;
		merged?: boolean;
		user?: { login?: string } | null;
		commits?: number;
		head?: { sha?: string };
	}>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`,
		{
			token
		}
	);
	if (!pullRequest.head?.sha) {
		throw new GitHubServiceError('GitHub pull request has no head commit');
	}

	return {
		number: pullRequest.number,
		htmlUrl: pullRequest.html_url,
		title: pullRequest.title,
		state: pullRequest.merged ? 'MERGED' : pullRequest.state.toUpperCase(),
		authorLogin: pullRequest.user?.login ?? null,
		commitCount: pullRequest.commits ?? 0,
		headSha: pullRequest.head.sha,
		checksStatus: await getCheckStatus(token, owner, repo, pullRequest.head.sha)
	};
}

export async function listPullRequestFiles(
	githubInstallationId: string,
	owner: string,
	repo: string,
	number: number
): Promise<{ files: GitHubPullRequestFile[]; hasMore: boolean }> {
	const token = await getInstallationAccessToken(githubInstallationId);
	const body = await githubRequest<
		Array<{
			filename?: string;
			status?: string;
			additions?: number;
			deletions?: number;
			changes?: number;
			patch?: string;
		}>
	>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}/files?per_page=40`,
		{ token }
	);

	const files = body.flatMap((file) => {
		if (!file.filename || !file.status) return [];
		return [
			{
				filename: file.filename,
				status: file.status,
				additions: file.additions ?? 0,
				deletions: file.deletions ?? 0,
				changes: file.changes ?? 0,
				patch: file.patch ?? null
			}
		];
	});

	return { files, hasMore: body.length >= 40 };
}

export async function listPullRequests(
	githubInstallationId: string,
	owner: string,
	repo: string
): Promise<GitHubPullRequestSnapshot[]> {
	const token = await getInstallationAccessToken(githubInstallationId);
	const body = await githubRequest<
		Array<{
			number: number;
			html_url: string;
			title: string;
			state: string;
			user?: { login?: string } | null;
			commits?: number;
			head?: { sha?: string };
		}>
	>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
		{ token }
	);

	return body.slice(0, 100).flatMap((pullRequest) => {
		if (!pullRequest.head?.sha) return [];
		return [
			{
				number: pullRequest.number,
				htmlUrl: pullRequest.html_url,
				title: pullRequest.title,
				state: pullRequest.state.toUpperCase(),
				authorLogin: pullRequest.user?.login ?? null,
				commitCount: pullRequest.commits ?? 0,
				headSha: pullRequest.head.sha,
				checksStatus: 'UNKNOWN'
			}
		];
	});
}

export function githubPullRequestRefFromUrl(
	value: string
): { owner: string; repo: string; number: number; url: string } | null {
	try {
		const url = new URL(value.trim());
		if (
			url.protocol !== 'https:' ||
			!['github.com', 'www.github.com'].includes(url.hostname)
		) {
			return null;
		}
		const match = url.pathname.match(
			/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/
		);
		if (!match) return null;
		const [, owner, repo, number] = match;
		if (!owner || !repo || !number) return null;
		return {
			owner,
			repo,
			number: Number(number),
			url: `https://github.com/${owner}/${repo}/pull/${number}`
		};
	} catch {
		return null;
	}
}

export async function getPullRequestSnapshotForRepository(
	repository: {
		owner: string;
		name: string;
		installation: { githubInstallationId: string; active: boolean };
	},
	prUrl: string
): Promise<GitHubPullRequestSnapshot> {
	const reference = githubPullRequestRefFromUrl(prUrl);
	if (
		!reference ||
		reference.owner !== repository.owner ||
		reference.repo !== repository.name
	) {
		throw new GitHubServiceError(
			'Pull request must belong to the linked GitHub repository'
		);
	}
	if (!repository.installation.active) {
		throw new GitHubServiceError(
			'The linked GitHub installation is no longer active'
		);
	}
	return getPullRequestSnapshot(
		repository.installation.githubInstallationId,
		repository.owner,
		repository.name,
		reference.number
	);
}

export function isGitHubAppConfigured(): boolean {
	try {
		requireConfig([
			'appId',
			'appSlug',
			'clientId',
			'clientSecret',
			'privateKey',
			'stateSecret'
		]);
		return true;
	} catch {
		return false;
	}
}

export function githubAppInstallUrl(): string {
	const config = requireConfig(['appSlug']);
	return `https://github.com/apps/${encodeURIComponent(config.appSlug)}/installations/new`;
}

export function verifyGitHubWebhookSignature(
	payload: string,
	signature: string | null
): boolean {
	const config = requireConfig(['webhookSecret']);
	if (!signature?.startsWith('sha256=')) return false;
	const actual = Buffer.from(signature.slice('sha256='.length), 'hex');
	const expected = createHmac('sha256', config.webhookSecret)
		.update(payload)
		.digest();
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}
