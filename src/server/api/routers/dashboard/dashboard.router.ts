import {
	LearningJourneyEventType,
	MentorAttentionSourceType
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { getCompetencyLearningContext } from '~/server/services/competency/competencyMatrix';
import {
	tryRecordFirstLearningAction,
	tryRecordLearningJourneyEvent,
	recommendationEventKey
} from '~/server/services/learningJourney/learningJourney.service';
import { buildLearningRecommendation } from '~/server/utils/learningRecommendation';
import { buildEnrolledProjectStats } from '../project/queries/enrolledProjectStats';

const dashboardOverviewProcedure = protectedProcedure.input(
	z.object({ userId: z.string().min(1) }).optional()
);

const MAX_JOURNEY_TIMING_ROWS = 10000;

function percentage(numerator: number, denominator: number) {
	return denominator === 0 ? null : Math.round((numerator / denominator) * 100);
}

function averageMinutesBetween(rows: Array<{ start: Date | null; end: Date }>) {
	const durations: number[] = [];
	for (const row of rows) {
		if (!row.start || row.end < row.start) continue;
		durations.push(
			Math.floor((row.end.getTime() - row.start.getTime()) / 60_000)
		);
	}
	if (durations.length === 0) return null;
	return Math.round(
		durations.reduce((total, duration) => total + duration, 0) /
			durations.length
	);
}

export const dashboardRouter = {
	recordRecommendationEvent: protectedProcedure
		.input(
			z.object({
				eventType: z.enum(['IMPRESSION', 'STARTED']),
				recommendationKey: z.string().trim().min(1).max(500)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const eventType =
				input.eventType === 'IMPRESSION'
					? LearningJourneyEventType.RECOMMENDATION_IMPRESSION
					: LearningJourneyEventType.RECOMMENDATION_STARTED;
			await tryRecordLearningJourneyEvent(ctx.db, {
				userId: ctx.session.userId,
				eventType,
				eventKey: recommendationEventKey(
					eventType,
					ctx.session.userId,
					input.recommendationKey
				),
				entityType: 'RECOMMENDATION',
				entityId: input.recommendationKey,
				recommendationKey: input.recommendationKey
			});
			if (input.eventType === 'STARTED') {
				await tryRecordFirstLearningAction(ctx.db, ctx.session.userId);
			}
			return { success: true };
		}),

	getLearningMetrics: adminProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const [
			diagnosedLearners,
			learnersWithDemonstratedCompetency,
			remediationByStatus,
			remediationReassessments,
			totalReassessmentActions,
			attentionItems,
			attentionResponseCount,
			attentionCompletionCount,
			responseAverage,
			completionAverage,
			peerReviewsByStatus,
			recommendationImpressionLearners,
			recommendationStartedLearners,
			secondEvaluationsApproved,
			firstActionLearnerRows,
			firstActionEvents,
			demonstratedEvidence
		] = await Promise.all([
			ctx.db.user.count({ where: { diagnosisCompletedAt: { not: null } } }),
			ctx.db.competencyMentorAssessment.findMany({
				where: { state: 'DEMONSTRATED' },
				distinct: ['learnerId'],
				take: MAX_JOURNEY_TIMING_ROWS,
				select: { learnerId: true }
			}),
			ctx.db.remediationAction.groupBy({
				by: ['status'],
				_count: { _all: true }
			}),
			ctx.db.remediationAction.count({
				where: {
					reassessmentReviewId: { not: null },
					status: 'COMPLETED'
				}
			}),
			ctx.db.remediationAction.count({
				where: {
					reassessmentReviewId: { not: null },
					status: { not: 'CANCELLED' }
				}
			}),
			ctx.db.mentorAttentionAssignment.count({
				where: { completedAt: null, dueAt: { lt: now } }
			}),
			ctx.db.mentorAttentionAssignment.count({
				where: {
					sourceType: {
						in: [
							MentorAttentionSourceType.PR_REVIEW,
							MentorAttentionSourceType.EXERCISE_REVIEW
						]
					},
					firstResponseAt: { not: null }
				}
			}),
			ctx.db.mentorAttentionAssignment.count({
				where: {
					sourceType: {
						in: [
							MentorAttentionSourceType.PR_REVIEW,
							MentorAttentionSourceType.EXERCISE_REVIEW
						]
					},
					completedAt: { not: null }
				}
			}),
			ctx.db.mentorAttentionAssignment.aggregate({
				where: {
					sourceType: {
						in: [
							MentorAttentionSourceType.PR_REVIEW,
							MentorAttentionSourceType.EXERCISE_REVIEW
						]
					},
					firstResponseMinutes: { not: null }
				},
				_avg: { firstResponseMinutes: true }
			}),
			ctx.db.mentorAttentionAssignment.aggregate({
				where: {
					sourceType: {
						in: [
							MentorAttentionSourceType.PR_REVIEW,
							MentorAttentionSourceType.EXERCISE_REVIEW
						]
					},
					completionMinutes: { not: null }
				},
				_avg: { completionMinutes: true }
			}),
			ctx.db.cohortPeerReview.groupBy({
				by: ['status'],
				_count: { _all: true }
			}),
			ctx.db.learningJourneyEvent.findMany({
				where: { eventType: 'RECOMMENDATION_IMPRESSION' },
				distinct: ['userId'],
				take: MAX_JOURNEY_TIMING_ROWS,
				select: { userId: true }
			}),
			ctx.db.learningJourneyEvent.findMany({
				where: { eventType: 'RECOMMENDATION_STARTED' },
				distinct: ['userId'],
				take: MAX_JOURNEY_TIMING_ROWS,
				select: { userId: true }
			}),
			ctx.db.learningJourneyEvent.count({
				where: { eventType: 'SECOND_EVALUATION_APPROVED' }
			}),
			ctx.db.learningJourneyEvent.findMany({
				where: { eventType: 'FIRST_ACTION' },
				distinct: ['userId'],
				take: MAX_JOURNEY_TIMING_ROWS,
				select: { userId: true }
			}),
			ctx.db.learningJourneyEvent.findMany({
				where: { eventType: 'FIRST_ACTION' },
				orderBy: { occurredAt: 'asc' },
				take: MAX_JOURNEY_TIMING_ROWS,
				select: {
					occurredAt: true,
					user: { select: { createdAt: true } }
				}
			}),
			ctx.db.competencyMentorAssessment.findMany({
				where: { state: 'DEMONSTRATED' },
				orderBy: { assessedAt: 'asc' },
				take: MAX_JOURNEY_TIMING_ROWS,
				select: {
					learnerId: true,
					assessedAt: true,
					learner: { select: { diagnosisCompletedAt: true } }
				}
			})
		]);

		const remediationCompleted =
			remediationByStatus.find((row) => row.status === 'COMPLETED')?._count
				._all ?? 0;
		const firstEvidenceByLearner = new Map<
			string,
			{ start: Date | null; end: Date }
		>();
		for (const evidence of demonstratedEvidence) {
			if (!firstEvidenceByLearner.has(evidence.learnerId)) {
				firstEvidenceByLearner.set(evidence.learnerId, {
					start: evidence.learner.diagnosisCompletedAt,
					end: evidence.assessedAt
				});
			}
		}

		return {
			diagnosedLearners,
			learnersWithDemonstratedCompetency:
				learnersWithDemonstratedCompetency.length,
			remediationByStatus: Object.fromEntries(
				remediationByStatus.map((row) => [row.status, row._count._all])
			),
			remediationReassessments,
			overdueMentorAttentionItems: attentionItems,
			peerReviewsByStatus: Object.fromEntries(
				peerReviewsByStatus.map((row) => [row.status, row._count._all])
			),
			journeyFunnel: {
				firstActionLearners: firstActionLearnerRows.length,
				recommendationImpressions: recommendationImpressionLearners.length,
				recommendationStarts: recommendationStartedLearners.length,
				remediationCompleted,
				secondEvaluationsApproved
			},
			journeyRates: {
				diagnosisToFirstAction: percentage(
					firstActionLearnerRows.length,
					diagnosedLearners
				),
				recommendationImpressionToStart: percentage(
					recommendationStartedLearners.length,
					recommendationImpressionLearners.length
				),
				remediationCompletion: percentage(
					remediationCompleted,
					remediationByStatus
						.filter((row) => row.status !== 'CANCELLED')
						.reduce((total, row) => total + row._count._all, 0)
				),
				secondEvaluationApproval: percentage(
					secondEvaluationsApproved,
					totalReassessmentActions
				)
			},
			journeyTiming: {
				averageSignupToFirstActionMinutes: averageMinutesBetween(
					firstActionEvents.map((event) => ({
						start: event.user.createdAt,
						end: event.occurredAt
					}))
				),
				averageDiagnosisToEvidenceMinutes: averageMinutesBetween([
					...firstEvidenceByLearner.values()
				]),
				averageReviewResponseMinutes:
					responseAverage._avg.firstResponseMinutes ?? null,
				averageReviewCompletionMinutes:
					completionAverage._avg.completionMinutes ?? null,
				reviewResponseCount: attentionResponseCount,
				reviewCompletionCount: attentionCompletionCount
			}
		};
	}),

	getOverview: dashboardOverviewProcedure.query(async ({ ctx, input }) => {
		const requestedUserId = input?.userId;
		const isViewingAnotherUser = Boolean(
			requestedUserId && requestedUserId !== ctx.session.userId
		);

		if (isViewingAnotherUser && !ctx.isAdmin) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only administrators can view another user dashboard'
			});
		}

		const userId = requestedUserId ?? ctx.session.userId;
		const profile = await ctx.db.user.findUnique({
			where: { id: userId },
			select: {
				name: true,
				email: true,
				learningGoal: true,
				weeklyAvailabilityBand: true,
				interestedTechnologies: true
			}
		});
		const viewedUser =
			isViewingAnotherUser && profile
				? { name: profile.name, email: profile.email }
				: null;

		if (isViewingAnotherUser && !viewedUser) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'User not found'
			});
		}

		const now = new Date();

		const [
			urgentTask,
			projects,
			exercise,
			activeReview,
			latestDecision,
			booking,
			notifications,
			latestExerciseDecision,
			remediationActions,
			competencyContext
		] = await Promise.all([
			ctx.db.task.findFirst({
				where: {
					status: { not: 'DONE' },
					project: {
						canceledAt: null,
						memberships: { some: { userId, status: 'ACTIVE' } }
					}
				},
				orderBy: [
					{ dueDate: 'asc' },
					{ priority: 'desc' },
					{ updatedAt: 'desc' }
				],
				take: 1,
				select: {
					id: true,
					title: true,
					status: true,
					priority: true,
					dueDate: true,
					project: { select: { id: true, title: true } }
				}
			}),
			ctx.db.project.findMany({
				where: {
					canceledAt: null,
					memberships: { some: { userId, status: 'ACTIVE' } }
				},
				orderBy: { updatedAt: 'desc' },
				take: 6,
				select: {
					id: true,
					title: true,
					description: true,
					sprints: {
						where: { status: 'ACTIVE' },
						orderBy: { order: 'asc' },
						take: 1,
						select: {
							title: true,
							endDate: true,
							committedPoints: true,
							tasks: { select: { status: true, storyPoints: true } }
						}
					},
					milestones: {
						select: {
							id: true,
							tasks: { select: { id: true, status: true } },
							epics: {
								select: {
									tasks: { select: { id: true, status: true } }
								}
							},
							sprints: {
								select: {
									tasks: { select: { id: true, status: true } }
								}
							}
						}
					}
				}
			}),
			ctx.db.userChallengeProgress.findFirst({
				where: {
					userId,
					status: { in: ['IN_PROGRESS', 'IN_REVIEW', 'CHANGES_REQUESTED'] }
				},
				orderBy: { updatedAt: 'desc' },
				select: {
					status: true,
					updatedAt: true,
					challenge: {
						select: {
							id: true,
							title: true,
							slug: true,
							track: { select: { name: true, slug: true } }
						}
					}
				}
			}),
			ctx.db.pullRequestReview.findFirst({
				where: {
					requestedById: userId,
					isActive: true,
					status: { in: ['PENDING', 'CHANGES_REQUESTED'] },
					task: { projectId: { not: null } }
				},
				orderBy: { createdAt: 'asc' },
				take: 1,
				select: {
					id: true,
					status: true,
					createdAt: true,
					task: {
						select: {
							id: true,
							title: true,
							project: { select: { id: true, title: true } }
						}
					}
				}
			}),
			ctx.db.pullRequestReview.findFirst({
				where: {
					requestedById: userId,
					status: { in: ['APPROVED', 'CHANGES_REQUESTED'] },
					task: { projectId: { not: null } }
				},
				orderBy: { updatedAt: 'desc' },
				take: 1,
				select: {
					id: true,
					status: true,
					updatedAt: true,
					reviewedAt: true,
					comment: true,
					task: {
						select: {
							id: true,
							title: true,
							projectId: true,
							project: { select: { id: true, title: true } }
						}
					},
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
			}),
			ctx.db.mentorshipBooking.findFirst({
				where: {
					userId,
					status: 'SCHEDULED',
					scheduledAt: { gte: now }
				},
				orderBy: { scheduledAt: 'asc' },
				take: 1,
				select: {
					id: true,
					scheduledAt: true,
					meetingUrl: true,
					bookingUrl: true
				}
			}),
			ctx.db.notification.findMany({
				where: { userId, read: false },
				orderBy: { createdAt: 'desc' },
				take: 5,
				select: {
					id: true,
					createdAt: true,
					title: true,
					message: true,
					link: true
				}
			}),
			ctx.db.exerciseReviewDecision.findFirst({
				where: {
					submission: { submittedById: userId },
					status: { in: ['APPROVED', 'CHANGES_REQUESTED'] }
				},
				orderBy: { updatedAt: 'desc' },
				take: 1,
				select: {
					status: true,
					updatedAt: true,
					reviewedAt: true,
					mentorComment: true,
					challenge: { select: { title: true } }
				}
			}),
			ctx.db.remediationAction.findMany({
				where: {
					learnerId: userId,
					status: { in: ['OPEN', 'IN_PROGRESS', 'SUBMITTED'] }
				},
				orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
				take: 20,
				select: {
					title: true,
					description: true,
					status: true,
					targetType: true,
					task: { select: { id: true, projectId: true } },
					challenge: {
						select: { slug: true, track: { select: { slug: true } } }
					},
					bookingId: true
				}
			}),
			getCompetencyLearningContext(ctx.db, userId)
		]);

		const projectIds = projects.map((project) => project.id);
		const [statusGroups, lastActivityGroups] = projectIds.length
			? await Promise.all([
					ctx.db.task.groupBy({
						by: ['projectId', 'status'],
						where: { projectId: { in: projectIds } },
						_count: { _all: true }
					}),
					ctx.db.task.groupBy({
						by: ['projectId'],
						where: { projectId: { in: projectIds } },
						_max: { updatedAt: true }
					})
				])
			: [[], []];

		const stats = buildEnrolledProjectStats({
			projectIds,
			statusCounts: statusGroups.map((row) => ({
				projectId: row.projectId,
				status: row.status,
				count: row._count._all
			})),
			lastActivityByProjectId: Object.fromEntries(
				lastActivityGroups
					.filter((row) => row.projectId)
					.map((row) => [row.projectId, row._max.updatedAt])
			)
		});

		const currentSprint = projects[0]?.sprints?.[0];
		const sprintPoints = currentSprint?.tasks.reduce(
			(total, task) => total + (task.storyPoints ?? 0),
			0
		);
		const sprintCompletedPoints = currentSprint?.tasks.reduce(
			(total, task) =>
				total + (task.status === 'DONE' ? (task.storyPoints ?? 0) : 0),
			0
		);
		const currentSprintSummary = currentSprint
			? {
					title: currentSprint.title,
					endDate: currentSprint.endDate,
					completedPoints: sprintCompletedPoints ?? 0,
					totalPoints: currentSprint.committedPoints ?? sprintPoints ?? 0
				}
			: null;
		const feedbackCandidates = [
			latestDecision
				? {
						date: latestDecision.reviewedAt ?? latestDecision.updatedAt,
						categories: latestDecision.analyses.flatMap((analysis) =>
							analysis.findings.map(
								(finding) => finding.editedCategory ?? finding.category
							)
						),
						text: latestDecision.comment
					}
				: null,
			latestExerciseDecision
				? {
						date:
							latestExerciseDecision.reviewedAt ??
							latestExerciseDecision.updatedAt,
						categories: [],
						text: latestExerciseDecision.mentorComment
					}
				: null
		].filter(
			(candidate): candidate is NonNullable<typeof candidate> =>
				candidate !== null
		);
		const recentFeedback =
			feedbackCandidates.sort(
				(left, right) => right.date.getTime() - left.date.getTime()
			)[0] ?? null;
		const learningRecommendation = buildLearningRecommendation({
			learningGoal: profile?.learningGoal ?? null,
			weeklyAvailabilityBand: profile?.weeklyAvailabilityBand ?? null,
			interestedTechnologies: profile?.interestedTechnologies ?? [],
			matrix: competencyContext.matrix,
			competencies: competencyContext.competencies,
			remediations: remediationActions,
			feedback: recentFeedback
				? {
						categories: recentFeedback.categories,
						text: recentFeedback.text
					}
				: null,
			activity: {
				task: urgentTask?.project
					? {
							id: urgentTask.id,
							title: urgentTask.title,
							projectId: urgentTask.project.id
						}
					: null,
				exercise: exercise
					? {
							title: exercise.challenge.title,
							slug: exercise.challenge.slug,
							trackSlug: exercise.challenge.track.slug
						}
					: null,
				project: projects[0]
					? { id: projects[0].id, title: projects[0].title }
					: null
			}
		});
		const learningRecommendationKey = learningRecommendation
			? [
					learningRecommendation.kind,
					learningRecommendation.reason,
					learningRecommendation.href,
					learningRecommendation.competency?.slug ?? ''
				].join('|')
			: null;

		return {
			...(viewedUser ? { viewedUser } : {}),
			urgentTask,
			currentSprint: currentSprintSummary,
			projects: projects.map((project) => {
				const milestones = project.milestones ?? [];
				const milestoneStats = milestones.map((milestone) => {
					const tasks = [
						...milestone.tasks,
						...milestone.epics.flatMap((epic) => epic.tasks),
						...milestone.sprints.flatMap((sprint) => sprint.tasks)
					];
					const uniqueTasks = [
						...new Map(tasks.map((task) => [task.id, task])).values()
					];
					const completedTasks = uniqueTasks.filter(
						(task) => task.status === 'DONE'
					).length;
					return {
						taskCount: uniqueTasks.length,
						completedTasks,
						completed:
							uniqueTasks.length > 0 && completedTasks === uniqueTasks.length
					};
				});
				const roadmapTaskCount = milestoneStats.reduce(
					(total, milestone) => total + milestone.taskCount,
					0
				);
				const roadmapCompletedTasks = milestoneStats.reduce(
					(total, milestone) => total + milestone.completedTasks,
					0
				);
				const hasRoadmap = milestones.length > 0;

				return {
					id: project.id,
					title: project.title,
					description: project.description,
					...(hasRoadmap
						? {
								progress: roadmapTaskCount
									? Math.round((roadmapCompletedTasks / roadmapTaskCount) * 100)
									: 0,
								totalTasks: roadmapTaskCount,
								completedTasks: roadmapCompletedTasks,
								completedMilestones: milestoneStats.filter(
									(milestone) => milestone.completed
								).length,
								totalMilestones: milestones.length,
								lastActivityAt: stats[project.id]?.lastActivityAt ?? null,
								usesRoadmap: true as const
							}
						: {
								...stats[project.id],
								usesRoadmap: false as const,
								completedMilestones: 0,
								totalMilestones: 0
							})
				};
			}),
			learningRecommendation,
			learningRecommendationKey,
			exercise,
			activeReview,
			latestDecision,
			booking,
			notifications
		};
	})
};
