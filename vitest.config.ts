import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'src/server/api/routers/template/tests/**'
		]
	},
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src')
		}
	}
});
