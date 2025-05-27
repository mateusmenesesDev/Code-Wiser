import * as dotenv from 'dotenv';
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

dotenv.config(); // <-- carrega o .env manualmente

export default {
	earlyAccess: true,
	schema: path.join('prisma')
} satisfies PrismaConfig;
