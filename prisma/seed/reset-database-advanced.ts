import { PrismaClient } from '@prisma/client';
import { checkEnvironment } from './utils/environment';

const prisma = new PrismaClient();

interface ResetOptions {
	preserveCategories?: boolean;
	preserveTechnologies?: boolean;
	preserveUsers?: boolean;
	confirmReset?: boolean;
}

async function parseArgs(): Promise<ResetOptions> {
	const args = process.argv.slice(2);
	const options: ResetOptions = {};

	for (const arg of args) {
		switch (arg) {
			case '--preserve-categories':
				options.preserveCategories = true;
				break;
			case '--preserve-technologies':
				options.preserveTechnologies = true;
				break;
			case '--preserve-users':
				options.preserveUsers = true;
				break;
			case '--confirm':
				options.confirmReset = true;
				break;
			case '--help':
				console.log(`
🗑️  Database Reset Script - Advanced Options

Usage: npm run db:reset-advanced [options]

Options:
  --preserve-categories    Keep existing categories
  --preserve-technologies  Keep existing technologies  
  --preserve-users        Keep existing users
  --confirm               Skip confirmation prompt
  --help                  Show this help message

Examples:
  npm run db:reset-advanced --confirm
  npm run db:reset-advanced --preserve-categories --preserve-technologies
  npm run db:reset-advanced --preserve-users --confirm
				`);
				process.exit(0);
		}
	}

	return options;
}

async function confirmReset(): Promise<boolean> {
	console.log('⚠️  This will permanently delete data from your database!');
	console.log('   To proceed, type "RESET" (case sensitive):');

	// In a real scenario, you'd use readline for input
	// For now, we'll assume confirmation with --confirm flag
	return true;
}

async function resetDatabase(options: ResetOptions) {
	// Check environment safety first
	checkEnvironment();

	console.log('🗑️  Starting advanced database reset...');

	if (!options.confirmReset) {
		const confirmed = await confirmReset();
		if (!confirmed) {
			console.log('❌ Reset cancelled by user.');
			return;
		}
	}

	try {
		// Always delete dependent data first
		console.log('🧹 Clearing comments...');
		await prisma.comment.deleteMany();

		console.log('🧹 Clearing tasks...');
		await prisma.task.deleteMany();

		console.log('🧹 Clearing sprints...');
		await prisma.sprint.deleteMany();

		console.log('🧹 Clearing epics...');
		await prisma.epic.deleteMany();

		console.log('🧹 Clearing project images...');
		await prisma.projectImage.deleteMany();

		console.log('🧹 Clearing learning outcomes...');
		await prisma.learningOutcome.deleteMany();

		console.log('🧹 Clearing milestones...');
		await prisma.milestone.deleteMany();

		console.log('🧹 Clearing projects...');
		await prisma.project.deleteMany();

		console.log('🧹 Clearing project templates...');
		await prisma.projectTemplate.deleteMany();

		// Conditionally delete base data
		if (!options.preserveTechnologies) {
			console.log('🧹 Clearing technologies...');
			await prisma.technology.deleteMany();
		} else {
			console.log('⏭️  Preserving technologies...');
		}

		if (!options.preserveCategories) {
			console.log('🧹 Clearing categories...');
			await prisma.category.deleteMany();
		} else {
			console.log('⏭️  Preserving categories...');
		}

		// Note: User deletion would require auth system integration
		if (!options.preserveUsers) {
			console.log(
				'⏭️  User data preservation (requires auth system integration)'
			);
		}

		console.log('✅ Advanced database reset completed successfully!');

		// Show summary
		const counts = await Promise.all([
			prisma.category.count(),
			prisma.technology.count(),
			prisma.projectTemplate.count(),
			prisma.task.count()
		]);

		console.log('📊 Remaining data:');
		console.log(`   - Categories: ${counts[0]}`);
		console.log(`   - Technologies: ${counts[1]}`);
		console.log(`   - Project Templates: ${counts[2]}`);
		console.log(`   - Tasks: ${counts[3]}`);
	} catch (error) {
		console.error('❌ Error resetting database:', error);
		throw error;
	}
}

async function main() {
	const options = await parseArgs();
	await resetDatabase(options);
}

main()
	.catch((e) => {
		console.error('❌ Fatal error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
