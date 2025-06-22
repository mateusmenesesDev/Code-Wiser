import { PrismaClient } from '@prisma/client';
import { checkEnvironment } from './utils/environment';

const prisma = new PrismaClient();

async function resetDatabase() {
	// Check environment safety first
	checkEnvironment();

	console.log('🗑️  Starting database reset...');

	try {
		// Delete in reverse dependency order to avoid foreign key constraint errors
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

		console.log('🧹 Clearing technologies...');
		await prisma.technology.deleteMany();

		console.log('🧹 Clearing categories...');
		await prisma.category.deleteMany();

		console.log('✅ Database reset completed successfully!');
		console.log('📊 All tables have been cleared.');
	} catch (error) {
		console.error('❌ Error resetting database:', error);
		throw error;
	}
}

async function main() {
	await resetDatabase();
}

main()
	.catch((e) => {
		console.error('❌ Fatal error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
