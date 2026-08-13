import { db } from '../src/server/db';

type TableRow = { table_name: string };
type MigrationRow = {
	migration_name: string;
	started_at: Date;
	finished_at: Date | null;
	rolled_back_at: Date | null;
};

async function checkProductionSchema() {
	const tables = await db.$queryRaw<TableRow[]>`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
			AND table_name IN ('_ProjectToUser', 'ProjectMembership')
		ORDER BY table_name
	`;

	const existingTables = new Set(tables.map(({ table_name }) => table_name));

	console.log('Production project membership tables:');
	console.log(
		`  ${existingTables.has('_ProjectToUser') ? '✅' : '❌'} _ProjectToUser`
	);
	console.log(
		`  ${existingTables.has('ProjectMembership') ? '✅' : '❌'} ProjectMembership`
	);

	try {
		const migrations = await db.$queryRaw<MigrationRow[]>`
			SELECT migration_name, started_at, finished_at, rolled_back_at
			FROM "public"."_prisma_migrations"
			ORDER BY started_at DESC
		`;

		console.log('\nRecent Prisma migrations:');
		console.table(migrations.slice(0, 10));
	} catch (error) {
		console.error('\nCould not read public._prisma_migrations:', error);
		process.exitCode = 1;
	}
}

checkProductionSchema()
	.catch((error) => {
		console.error('Could not inspect the production schema:', error);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
