import type { PrismaClient } from '@prisma/client';
import { getPortfolioCompletion } from '~/features/portfolio/utils/completion';

export async function getPublicPortfolioByCode(
	db: PrismaClient,
	publicCode: string
) {
	const project = await db.project.findFirst({
		where: {
			publicCode,
			canceledAt: null,
			portfolioPublishedAt: { not: null }
		},
		select: {
			id: true,
			title: true,
			description: true,
			portfolioSummary: true,
			portfolioDemoUrl: true,
			portfolioShowDemo: true,
			portfolioShowRepository: true,
			portfolioFeedback: true,
			portfolioEvaluatedAt: true,
			portfolioEvaluatedBy: { select: { name: true } },
			updatedAt: true,
			category: { select: { name: true } },
			technologies: {
				select: { id: true, name: true },
				orderBy: { name: 'asc' }
			},
			githubRepository: { select: { htmlUrl: true, private: true } },
			tasks: {
				select: {
					id: true,
					title: true,
					publicNumber: true,
					status: true,
					portfolioRelevant: true,
					milestoneId: true,
					reviews: {
						where: { isActive: true },
						select: { status: true }
					}
				}
			},

			milestones: {
				orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
				select: {
					id: true,
					title: true,
					description: true,
					reviewedAt: true,
					reviewedBy: { select: { name: true } }
				}
			}
		}
	});

	if (!project) return null;

	const incompleteTaskCount = project.tasks.filter(
		(task) => task.status !== 'DONE'
	).length;
	const completion = getPortfolioCompletion({
		taskCount: project.tasks.length,
		incompleteTaskCount,
		milestoneCount: project.milestones.length,
		unreviewedMilestoneCount: project.milestones.filter(
			(milestone) => milestone.reviewedAt === null
		).length,
		pendingReviewCount: project.tasks
			.flatMap((task) => task.reviews)
			.filter((review) => review.status === 'PENDING').length,
		hasMentorEvaluation: Boolean(
			project.portfolioFeedback?.trim() && project.portfolioEvaluatedAt
		)
	});

	return {
		id: project.id,
		title: project.title,
		description: project.description,
		summary: project.portfolioSummary?.trim() || project.description,
		category: project.category.name,
		technologies: project.technologies,
		demoUrl:
			project.portfolioShowDemo && project.portfolioDemoUrl
				? project.portfolioDemoUrl
				: null,
		repositoryUrl:
			project.portfolioShowRepository &&
			project.githubRepository &&
			!project.githubRepository.private
				? project.githubRepository.htmlUrl
				: null,
		milestones: project.milestones.map((milestone) => ({
			id: milestone.id,
			title: milestone.title,
			description: milestone.description,
			reviewedAt: milestone.reviewedAt,
			reviewedBy: milestone.reviewedBy?.name ?? null,
			tasks: project.tasks
				.filter(
					(task) => task.portfolioRelevant && task.milestoneId === milestone.id
				)
				.map(
					({
						portfolioRelevant: _portfolioRelevant,
						milestoneId: _milestoneId,
						reviews: _reviews,
						...task
					}) => task
				)
		})),
		relevantTasks: project.tasks
			.filter((task) => task.portfolioRelevant)
			.map(
				({
					portfolioRelevant: _portfolioRelevant,
					milestoneId: _milestoneId,
					reviews: _reviews,
					...task
				}) => task
			),
		mentorFeedback: project.portfolioFeedback?.trim() || null,
		mentorName: project.portfolioEvaluatedBy?.name ?? null,
		evaluatedAt: project.portfolioEvaluatedAt,
		updatedAt: project.updatedAt,
		completion
	};
}
