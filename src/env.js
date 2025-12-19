import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		UPLOADTHING_TOKEN: z.string(),
		STRIPE_SECRET_KEY: z.string(),
		STRIPE_CREDITS_500_PRICE_ID: z.string(),
		STRIPE_CREDITS_1500_PRICE_ID: z.string(),
		STRIPE_CREDITS_3000_PRICE_ID: z.string(),
		STRIPE_WEBHOOK_SECRET: z.string(),
		CLERK_WEBHOOK_SECRET: z.string(),
		// Real-time communication (Pusher)
		PUSHER_APP_ID: z.string(),
		PUSHER_SECRET: z.string(),
		// Email service (Resend)
		RESEND_API_KEY: z.string(),
		// Cal.com integration
		CALCOM_API_KEY: z.string(),
		CALCOM_EVENT_TYPE_ID: z.string(),
		CALCOM_WEBHOOK_SECRET: z.string(),
		// Cron job security
		CRON_SECRET: z.string()
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// Real-time communication (Pusher) - client-side
		NEXT_PUBLIC_PUSHER_KEY: z.string(),
		NEXT_PUBLIC_PUSHER_CLUSTER: z.string(),
		// Cal.com configuration
		NEXT_PUBLIC_CALCOM_USERNAME: z.string(),
		NEXT_PUBLIC_CALCOM_CLIENT_ID: z.string().optional()
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		STRIPE_CREDITS_500_PRICE_ID: process.env.STRIPE_CREDITS_500_PRICE_ID,
		STRIPE_CREDITS_1500_PRICE_ID: process.env.STRIPE_CREDITS_1500_PRICE_ID,
		STRIPE_CREDITS_3000_PRICE_ID: process.env.STRIPE_CREDITS_3000_PRICE_ID,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
		// Real-time communication (Pusher)
		PUSHER_APP_ID: process.env.PUSHER_APP_ID,
		PUSHER_SECRET: process.env.PUSHER_SECRET,
		NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
		NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
		// Email service (Resend)
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		// Cal.com integration
		CALCOM_API_KEY: process.env.CALCOM_API_KEY,
		CALCOM_EVENT_TYPE_ID: process.env.CALCOM_EVENT_TYPE_ID,
		CALCOM_WEBHOOK_SECRET: process.env.CALCOM_WEBHOOK_SECRET,
		NEXT_PUBLIC_CALCOM_USERNAME: process.env.NEXT_PUBLIC_CALCOM_USERNAME,
		NEXT_PUBLIC_CALCOM_CLIENT_ID: process.env.NEXT_PUBLIC_CALCOM_CLIENT_ID,
		// Cron job security
		CRON_SECRET: process.env.CRON_SECRET
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true
});
