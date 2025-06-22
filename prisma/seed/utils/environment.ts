export function checkEnvironment() {
	const nodeEnv = process.env.NODE_ENV?.toLowerCase();
	const environment = process.env.ENVIRONMENT?.toLowerCase();

	const isProd =
		nodeEnv === 'production' ||
		environment === 'production' ||
		environment === 'prod' ||
		process.env.VERCEL_ENV === 'production' ||
		process.env.RAILWAY_ENVIRONMENT === 'production';

	if (isProd) {
		console.error('🚫 SAFETY CHECK FAILED!');
		console.error('❌ This script cannot run in production environment.');
		console.error('📋 Current environment indicators:');
		console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
		console.error(`   ENVIRONMENT: ${process.env.ENVIRONMENT || 'undefined'}`);
		console.error(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`);
		console.error(
			`   RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'undefined'}`
		);
		console.error('');
		console.error(
			'💡 To run this script, ensure you are in a development environment.'
		);
		console.error('   Set NODE_ENV=development or ENVIRONMENT=development');
		process.exit(1);
	}

	console.log('✅ Environment check passed - running in development mode');
	console.log(`📋 Environment: ${nodeEnv || environment || 'development'}`);
}
