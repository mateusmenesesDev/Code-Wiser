import { execSync } from 'node:child_process';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.js');

function resolveSentryRelease() {
	const fromEnv =
		process.env.SENTRY_RELEASE?.trim() ||
		process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
		process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim();
	if (fromEnv && /^[a-f0-9]{7,40}$/i.test(fromEnv)) {
		return fromEnv;
	}
	try {
		const sha = execSync('git rev-parse HEAD', {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
		return /^[a-f0-9]{7,40}$/i.test(sha) ? sha : undefined;
	} catch {
		return undefined;
	}
}

const sentryRelease = resolveSentryRelease();
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
if (sentryRelease) {
	process.env.SENTRY_RELEASE = sentryRelease;
	process.env.NEXT_PUBLIC_SENTRY_RELEASE = sentryRelease;
}

/** @type {import("next").NextConfig} */
const config = {
	env: {
		...(sentryRelease
			? {
					SENTRY_RELEASE: sentryRelease,
					NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease
				}
			: {})
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.ufs.sh'
			},
			{
				protocol: 'https',
				hostname: 'img.clerk.com'
			}
		]
	},
	headers: async () => {
		const isProduction = process.env.NODE_ENV === 'production';
		const robotsTag = isProduction ? 'index, follow' : 'noindex, nofollow';
		return [
			{
				source: '/(.*)',
				headers: [{ key: 'X-Robots-Tag', value: robotsTag }]
			}
		];
	}
};

// Injected content via Sentry wizard below

export default withSentryConfig(withNextIntl(config), {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: 'code-wise',
	project: 'javascript-nextjs',
	release: sentryRelease
		? {
				name: sentryRelease
			}
		: undefined,

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	tunnelRoute: '/monitoring',

	webpack: {
		automaticVercelMonitors: true,
		treeshake: {
			removeDebugLogging: true
		}
	}
});
