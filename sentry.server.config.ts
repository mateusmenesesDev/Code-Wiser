// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { resolveSentryRelease } from './src/lib/sentry-release';

Sentry.init({
	dsn: 'https://f95684bdc443054e50a035e1afc29ec3@o4511745086324736.ingest.us.sentry.io/4511745095368704',

	// Git SHA so Remedy can map Sentry incidents → exact commit checkout.
	release: resolveSentryRelease(),

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	dataCollection: {
		// To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
		// userInfo: false,
		// httpBodies: [],
	}
});
