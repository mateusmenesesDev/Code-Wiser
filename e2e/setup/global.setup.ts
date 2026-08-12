import { clerkSetup } from '@clerk/testing/playwright';
import prepareFixture from './database';

export default async function globalSetup() {
	await clerkSetup({ dotenv: false });
	await prepareFixture();
}
