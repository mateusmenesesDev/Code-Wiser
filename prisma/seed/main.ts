import { PrismaClient } from '@prisma/client';
import { orchestrateSeedDataCreation } from './orchestrator';
import { checkEnvironment } from './utils/environment';

const prisma = new PrismaClient();

async function main() {
	checkEnvironment();

	try {
		await orchestrateSeedDataCreation(prisma);
	} catch (error) {
		console.error('❌ Fatal error:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
