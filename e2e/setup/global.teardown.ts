import { access, rm } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
	cleanupFixture,
	e2eDatabaseUrl,
	fixturePath,
	loadFixture
} from './database';

export default async function globalTeardown() {
	try {
		await access(fixturePath);
	} catch {
		return;
	}

	const prisma = new PrismaClient({
		datasources: { db: { url: e2eDatabaseUrl() } }
	});
	try {
		await prisma.$connect();
		await cleanupFixture(prisma, await loadFixture());
	} finally {
		await prisma.$disconnect().catch(() => undefined);
		await rm(fixturePath, { force: true });
		await rm(path.resolve(process.cwd(), 'playwright/.auth'), {
			recursive: true,
			force: true
		});
	}
}
