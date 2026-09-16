import type { PrismaClient } from '@prisma/client';
import { getPortfolioCompletion } from '~/features/portfolio/utils/completion';
import type { CompetencyState } from '~/server/utils/competencyMatrix';

type PublicPortfolioCompetency = {
	sortOrder: number;
	slug: string;
	name: string;
	description: string;
	state: Exclude<CompetencyState, 'NOT_EVALUATED'>;
	evidence: Array<{
		source: 'PROJECT' | 'PR_REVIEW';
		state: Exclude<CompetencyState, 'NOT_EVALUATED'>;
		title: string;
		detail: string;
		date: Date;
	}>;
};

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
			learningOutcomes: {
				select: {
					value: true,
					updatedAt: true,
					competencies: {
						select: {
							competency: {
								select: {
									slug: true,
									name: true,
									description: true,
									sortOrder: true
								}
							}
						}
					}
				}
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
						select: {
							status: true,
							updatedAt: true,
							githubTitle: true,
							prUrl: true,
							analyses: {
								where: { status: 'COMPLETED' },
								select: {
									findings: {
										where: { decision: { not: 'DISCARDED' } },
										select: {
											category: true,
											editedCategory: true
										}
									}
								}
							}
						}
					}
				}
			},

			milestones: {
				orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
				select: {
					id: true,
					title: true,
					description: true,
					completed: true,
					updatedAt: true,
					reviewedAt: true,
					reviewedBy: { select: { name: true } },
					competencies: {
						select: {
							competency: {
								select: {
									slug: true,
									name: true,
									description: true,
									sortOrder: true
								}
							}
						}
					}
				}
			}
		}
	});

	if (!project) return null;

	const selectedReviews = project.tasks
		.filter((task) => task.portfolioRelevant)
		.flatMap((task) => task.reviews);
	const reviewCategories = [
		...new Set(
			selectedReviews.flatMap((review) =>
				review.analyses.flatMap((analysis) =>
					analysis.findings.map(
						(finding) => finding.editedCategory ?? finding.category
					)
				)
			)
		)
	];
	const reviewCompetencies =
		reviewCategories.length > 0
			? await db.competency.findMany({
					where: {
						isActive: true,
						reviewCategories: {
							some: { category: { in: reviewCategories } }
						}
					},
					select: {
						slug: true,
						name: true,
						description: true,
						sortOrder: true,
						reviewCategories: { select: { category: true } }
					}
				})
			: [];

	const competencyMap = new Map<string, PublicPortfolioCompetency>();
	const addCompetencyEvidence = (
		competency: {
			slug: string;
			name: string;
			description: string;
			sortOrder: number;
		},
		evidence: PublicPortfolioCompetency['evidence'][number]
	) => {
		const current = competencyMap.get(competency.slug);
		if (current) {
			current.evidence.push(evidence);
			if (evidence.state === 'DEMONSTRATED') {
				current.state = 'DEMONSTRATED';
			}
			return;
		}

		competencyMap.set(competency.slug, {
			sortOrder: competency.sortOrder,
			slug: competency.slug,
			name: competency.name,
			description: competency.description,
			state: evidence.state,
			evidence: [evidence]
		});
	};

	for (const outcome of project.learningOutcomes) {
		for (const { competency } of outcome.competencies) {
			addCompetencyEvidence(competency, {
				source: 'PROJECT',
				state: project.portfolioEvaluatedAt ? 'DEMONSTRATED' : 'IN_DEVELOPMENT',
				title: outcome.value,
				detail: 'Learning outcome',
				date: project.portfolioEvaluatedAt ?? outcome.updatedAt
			});
		}
	}

	for (const milestone of project.milestones) {
		for (const { competency } of milestone.competencies) {
			addCompetencyEvidence(competency, {
				source: 'PROJECT',
				state:
					milestone.completed || milestone.reviewedAt
						? 'DEMONSTRATED'
						: 'IN_DEVELOPMENT',
				title: milestone.title,
				detail: 'Milestone',
				date: milestone.reviewedAt ?? milestone.updatedAt
			});
		}
	}

	for (const competency of reviewCompetencies) {
		for (const review of selectedReviews) {
			const categories = new Set(
				review.analyses.flatMap((analysis) =>
					analysis.findings.map(
						(finding) => finding.editedCategory ?? finding.category
					)
				)
			);
			if (
				!competency.reviewCategories.some(({ category }) =>
					categories.has(category)
				)
			) {
				continue;
			}
			addCompetencyEvidence(competency, {
				source: 'PR_REVIEW',
				state: review.status === 'APPROVED' ? 'DEMONSTRATED' : 'IN_DEVELOPMENT',
				title: review.githubTitle ?? review.prUrl,
				detail: 'Pull request review',
				date: review.updatedAt
			});
		}
	}

	const competencies = [...competencyMap.values()]
		.sort(
			(left, right) =>
				left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
		)
		.map(({ sortOrder: _sortOrder, ...competency }) => ({
			...competency,
			evidence: competency.evidence
				.sort((left, right) => right.date.getTime() - left.date.getTime())
				.slice(0, 5)
		}));

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
		competencies,
		updatedAt: project.updatedAt,
		completion
	};
}
