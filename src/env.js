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
		CLERK_WEBHOOK_SECRET: z.string()
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
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
		CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET
		// NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
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
