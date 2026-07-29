/**
 * Performance benchmark harness (Phase 1+).
 *
 * Client microbenchmarks always run (no DB).
 * Server benches require DATABASE_URL and a seeded stress fixture.
 *
 * Run:
 *   bun run bench                 # client-only
 *   bun run bench:full            # client + server (infisical)
 *   bun run bench -- --label baseline --out benchmarks/results/baseline-phase1.json
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { runClientBenches } from '../../src/server/benchmarks/clientBenches';
import {
	type ServerBenchReport,
	buildBenchmarkReport
} from '../../src/server/benchmarks/report';
import { runServerBenches } from '../../src/server/benchmarks/serverBenches';
import {
	DEFAULT_STRESS_SCALE,
	resolveStressScale
} from '../../src/server/benchmarks/stressFixture';

function parseArgs(argv: string[]) {
	const get = (flag: string) => {
		const index = argv.indexOf(flag);
		return index === -1 ? undefined : argv[index + 1];
	};

	return {
		label: get('--label') ?? 'adhoc',
		phase: get('--phase') ?? 'phase-1',
		out:
			get('--out') ??
			path.join('benchmarks', 'results', `${get('--label') ?? 'adhoc'}.json`),
		clientOnly: argv.includes('--client-only'),
		boardTasks: Number(get('--board-tasks') ?? DEFAULT_STRESS_SCALE.boardTasks),
		iterations: Number(get('--iterations') ?? 25),
		serverIterations: Number(get('--server-iterations') ?? 5)
	};
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const scale = resolveStressScale({ boardTasks: args.boardTasks });

	const client = runClientBenches({
		boardTasks: args.boardTasks,
		iterations: args.iterations
	});

	let server: ServerBenchReport = {
		available: false,
		reason: 'Skipped (--client-only or missing DATABASE_URL)'
	};

	const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
	if (!args.clientOnly && hasDatabaseUrl) {
		const db = new PrismaClient();
		try {
			server = await runServerBenches(db, {
				iterations: args.serverIterations
			});
		} finally {
			await db.$disconnect();
		}
	} else if (!args.clientOnly && !hasDatabaseUrl) {
		server = {
			available: false,
			reason: 'DATABASE_URL not set; ran client benches only'
		};
	}

	const report = buildBenchmarkReport({
		phase: args.phase,
		label: args.label,
		scale,
		client,
		server
	});

	const outPath = path.resolve(args.out);
	await mkdir(path.dirname(outPath), { recursive: true });
	await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

	console.log(JSON.stringify(report, null, 2));
	console.log(`\nWrote ${outPath}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
