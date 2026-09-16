import { PrismaClient } from '@prisma/client';
import { checkEnvironment } from './utils/environment';

const prisma = new PrismaClient();

async function resetDatabase() {
	// Check environment safety first
	checkEnvironment();

	console.log('🗑️  Starting database reset...');

	try {
		// Delete in reverse dependency order to avoid foreign key constraint errors
		console.log('🧹 Clearing learning plans and analytics...');
		await prisma.learningPlanItemDependency.deleteMany();
		await prisma.learningPlanItem.deleteMany();
		await prisma.learningPlan.deleteMany();
		await prisma.learningJourneyEvent.deleteMany();

		console.log('🧹 Clearing competencies...');
		await prisma.competencyMentorAssessment.deleteMany();
		await prisma.competencyExerciseChallenge.deleteMany();
		await prisma.competencyLearningOutcome.deleteMany();
		await prisma.competencyMilestone.deleteMany();
		await prisma.competencyReviewCategory.deleteMany();
		await prisma.competency.deleteMany();

		console.log('🧹 Clearing cohorts and peer reviews...');
		await prisma.cohortPeerReviewCalibration.deleteMany();
		await prisma.cohortPeerReviewReport.deleteMany();
		await prisma.cohortPeerReview.deleteMany();
		await prisma.cohortProject.deleteMany();
		await prisma.cohortMembership.deleteMany();
		await prisma.cohort.deleteMany();

		console.log('🧹 Clearing comments...');
		await prisma.exerciseReviewDecision.deleteMany();
		await prisma.exerciseReviewSubmission.deleteMany();
		await prisma.userChallengeProgress.deleteMany();
		await prisma.exerciseChallenge.deleteMany();
		await prisma.exerciseTrack.deleteMany();

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
