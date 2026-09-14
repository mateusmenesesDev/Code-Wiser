import type { PrismaClient } from '@prisma/client';
import {
	type CompetencyMatrixEntry,
	buildCompetencyMatrix,
	evidenceForCompetency
} from '~/server/utils/competencyMatrix';

export type CompetencyLearningContext = {
	matrix: CompetencyMatrixEntry[];
	competencies: Array<{
		slug: string;
		name: string;
		description: string;
		sortOrder: number;
		exerciseChallenges: Array<{
			id: string;
			title: string;
			slug: string;
			difficulty: 'EASY' | 'MEDIUM' | 'HARD';
			sortOrder: number;
			isArchived: boolean;
			track: {
				name: string;
				slug: string;
				isPublished: boolean;
				isArchived: boolean;
			};
			progressStatus: string | null;
		}>;
		reviewCategories: string[];
	}>;
};

export async function getCompetencyLearningContext(
	db: PrismaClient,
	userId: string
): Promise<CompetencyLearningContext> {
	const [competencies, challengeProgress, memberships, reviews] =
		await Promise.all([
			db.competency.findMany({
				where: { isActive: true },
				orderBy: { sortOrder: 'asc' },
				select: {
					slug: true,
					name: true,
					description: true,
					sortOrder: true,
					exerciseChallenges: {
						select: {
							challengeId: true,
							challenge: {
								select: {
									id: true,
									title: true,
									slug: true,
									difficulty: true,
									sortOrder: true,
									isArchived: true,
									track: {
										select: {
											name: true,
											slug: true,
											isPublished: true,
											isArchived: true
										}
									},
									progress: {
										where: { userId },
										select: { status: true },
										take: 1
									}
								}
							}
						}
					},
					learningOutcomes: { select: { learningOutcomeId: true } },
					milestones: { select: { milestoneId: true } },
					reviewCategories: { select: { category: true } },
					mentorAssessments: {
						where: { learnerId: userId },
						orderBy: { assessedAt: 'desc' },
						take: 10,
						select: {
							state: true,
							note: true,
							assessedAt: true
						}
					}
				}
			}),
			db.userChallengeProgress.findMany({
				where: { userId, status: { not: 'NOT_STARTED' } },
				orderBy: { updatedAt: 'desc' },
				take: 100,
				select: {
					challengeId: true,
					status: true,
					updatedAt: true,
					challenge: {
						select: {
							title: true,
							track: { select: { name: true } }
						}
					}
				}
			}),
			db.projectMembership.findMany({
				where: {
					userId,
					status: 'ACTIVE',
					project: { canceledAt: null }
				},
				orderBy: { updatedAt: 'desc' },
				take: 50,
				select: {
					project: {
						select: {
							title: true,
							updatedAt: true,
							portfolioEvaluatedAt: true,
							learningOutcomes: { select: { id: true, value: true } },
							milestones: {
								select: {
									id: true,
									title: true,
									updatedAt: true,
									completed: true,
									reviewedAt: true
								}
							}
						}
					}
				}
			}),
			db.pullRequestReview.findMany({
				where: { requestedById: userId, isActive: true },
				orderBy: { updatedAt: 'desc' },
				take: 100,
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
								select: { category: true, editedCategory: true }
							}
						}
					}
				}
			})
		]);

	const competencyInputs = competencies.map((competency) => ({
		slug: competency.slug,
		name: competency.name,
		description: competency.description,
		exerciseChallengeIds: competency.exerciseChallenges.map(
			(mapping) => mapping.challengeId
		),
		learningOutcomeIds: competency.learningOutcomes.map(
			(mapping) => mapping.learningOutcomeId
		),
		milestoneIds: competency.milestones.map((mapping) => mapping.milestoneId),
		reviewCategories: competency.reviewCategories.map(
			(mapping) => mapping.category
		)
	}));
	const evidence = [];

	for (const progress of challengeProgress) {
		const state =
			progress.status === 'APPROVED' ? 'DEMONSTRATED' : 'IN_DEVELOPMENT';
		for (const competency of competencyInputs) {
			if (!competency.exerciseChallengeIds.includes(progress.challengeId))
				continue;
			evidence.push(
				evidenceForCompetency(competency.slug, {
					source: 'EXERCISE',
					state,
					title: progress.challenge.title,
					detail: `${progress.challenge.track.name} · ${progress.status}`,
					date: progress.updatedAt
				})
			);
		}
	}

	for (const membership of memberships) {
		const project = membership.project;
		for (const outcome of project.learningOutcomes) {
			for (const competency of competencyInputs) {
				if (!competency.learningOutcomeIds.includes(outcome.id)) continue;
				evidence.push(
					evidenceForCompetency(competency.slug, {
						source: 'PROJECT',
						state: project.portfolioEvaluatedAt
							? 'DEMONSTRATED'
							: 'IN_DEVELOPMENT',
						title: outcome.value,
						detail: project.title,
						date: project.portfolioEvaluatedAt ?? project.updatedAt
					})
				);
			}
		}

		for (const milestone of project.milestones) {
			for (const competency of competencyInputs) {
				if (!competency.milestoneIds.includes(milestone.id)) continue;
				evidence.push(
					evidenceForCompetency(competency.slug, {
						source: 'PROJECT',
						state:
							milestone.completed || milestone.reviewedAt
								? 'DEMONSTRATED'
								: 'IN_DEVELOPMENT',
						title: milestone.title,
						detail: project.title,
						date: milestone.reviewedAt ?? milestone.updatedAt
					})
				);
			}
		}
	}

	for (const review of reviews) {
		const reviewCategories = new Set(
			review.analyses.flatMap((analysis) =>
				analysis.findings.map(
					(finding) => finding.editedCategory ?? finding.category
				)
			)
		);
		for (const competency of competencyInputs) {
			if (
				!competency.reviewCategories.some((category) =>
					reviewCategories.has(category)
				)
			)
				continue;
			evidence.push(
				evidenceForCompetency(competency.slug, {
					source: 'PR_REVIEW',
					state:
						review.status === 'APPROVED' ? 'DEMONSTRATED' : 'IN_DEVELOPMENT',
					title: review.githubTitle ?? review.prUrl,
					detail: review.status,
					date: review.updatedAt
				})
			);
		}
	}

	for (const competency of competencies) {
		for (const assessment of competency.mentorAssessments) {
			evidence.push(
				evidenceForCompetency(competency.slug, {
					source: 'MENTOR',
					state: assessment.state,
					title: 'Mentor assessment',
					detail: assessment.note ?? 'Competency assessed during mentorship',
					date: assessment.assessedAt
				})
			);
		}
	}

	return {
		matrix: buildCompetencyMatrix({ competencies: competencyInputs, evidence }),
		competencies: competencies.map((competency) => ({
			slug: competency.slug,
			name: competency.name,
			description: competency.description,
			sortOrder: competency.sortOrder,
			reviewCategories: competency.reviewCategories.map(
				(mapping) => mapping.category
			),
			exerciseChallenges: competency.exerciseChallenges.map((mapping) => ({
				...mapping.challenge,
				progressStatus: mapping.challenge.progress[0]?.status ?? null
			}))
		}))
	};
}

export async function getCompetencyMatrix(db: PrismaClient, userId: string) {
	const context = await getCompetencyLearningContext(db, userId);
	return context.matrix;
}
