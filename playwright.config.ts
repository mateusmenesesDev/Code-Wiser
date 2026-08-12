import 'dotenv/config';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL?.trim() || 'http://127.0.0.1:3001';
const databaseUrl = process.env.E2E_DATABASE_URL?.trim();

if (!databaseUrl) {
	throw new Error('E2E_DATABASE_URL is required to run Playwright tests');
}

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	timeout: 120_000,
	reporter: [
		['list'],
		['html', { outputFolder: 'playwright/report', open: 'never' }]
	],
	globalSetup: path.resolve(process.cwd(), 'e2e/setup/global.setup.ts'),
	globalTeardown: path.resolve(process.cwd(), 'e2e/setup/global.teardown.ts'),
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/
		},
		{
			name: 'chromium',
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: path.resolve(process.cwd(), 'playwright/.auth/user.json')
			},
			testMatch: /p0-4\.spec\.ts/
		}
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: 'bun next start -p 3001',
				url: baseURL,
				reuseExistingServer: false,
				timeout: 180_000,
				env: {
					DATABASE_URL: databaseUrl
				}
			}
});
