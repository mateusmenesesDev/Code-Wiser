/**
 * Git SHA used as Sentry `release` so Remedy (and Sentry releases) can map
 * an incident to an exact repository commit (7–40 hex chars).
 */
const SHA_PATTERN = /^[a-f0-9]{7,40}$/i;

export function resolveSentryRelease(
	env: NodeJS.ProcessEnv = process.env
): string | undefined {
	const candidates = [
		env.SENTRY_RELEASE,
		env.VERCEL_GIT_COMMIT_SHA,
		env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
		env.NEXT_PUBLIC_SENTRY_RELEASE
	];

	for (const candidate of candidates) {
		const value = candidate?.trim();
		if (value && SHA_PATTERN.test(value)) {
			return value;
		}
	}

	return undefined;
}
