import { TRPCError } from '@trpc/server';
import {
	PEER_REVIEW_CALIBRATION_PASS_SCORE,
	PEER_REVIEW_CALIBRATION_VERSION,
	peerReviewCalibrationPrompts,
	peerReviewChecklist,
	peerReviewRubric
} from '~/features/cohorts/data/peerReviewCalibration';
import {
	assignCohortProjectSchema,
	assignPeerReviewSchema,
	cohortMemberSchema,
	cohortPeerReviewIdSchema,
	completeCohortEventSchema,
	completePeerReviewCalibrationSchema,
	createCohortEventSchema,
	createCohortSchema,
	getPeerReviewCalibrationSchema,
	listPeerReviewSuggestionsSchema,
	reportPeerReviewSchema,
	resolvePeerReviewReportSchema,
	submitPeerReviewSchema,
	updateCohortEventSchema,
	updateCohortSchema
} from '~/features/cohorts/schemas/cohort.schema';
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from '~/server/api/trpc';

const MAX_PEER_REVIEW_SUGGESTIONS = 10;
const reviewerCapacityByAvailability: Record<string, number> = {
	UNDER_3: 1,
	FROM_4_TO_7: 2,
	FROM_8_TO_12: 3,
	OVER_12: 4
};

const hasPeerReviewProjectAccess = (project: {
	githubRepository: { private: boolean } | null;
	memberships: Array<{ id: string }>;
}) =>
	project.memberships.length > 0 || project.githubRepository?.private === false;

export const cohortRouter = createTRPCRouter({
	list: adminProcedure.query(async ({ ctx }) =>
		ctx.db.cohort.findMany({
			take: 100,
			orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
			select: {
				id: true,
				name: true,
				description: true,
				startsAt: true,
				endsAt: true,
				status: true,
				memberships: {
					where: { status: 'ACTIVE' },
					select: {
						id: true,
						userId: true,
						user: { select: { id: true, name: true, email: true } }
					}
				},
				peerReviews: {
					take: 100,
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						status: true,
						feedback: true,
						submittedAt: true,
						reviewer: { select: { id: true, name: true, email: true } },
						author: { select: { id: true, name: true, email: true } },
						pullRequestReview: {
							select: {
								id: true,
								prUrl: true,
								githubTitle: true,
								status: true,
								task: {
									select: {
										title: true,
										project: { select: { title: true } }
									}
								}
							}
						}
					}
				},
				projects: {
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						project: {
							select: {
								id: true,
								title: true,
								maxParticipants: true,
								accessType: true,
								canceledAt: true
							}
						}
					}
				},
				events: {
					take: 100,
					orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
					select: {
						id: true,
						type: true,
						status: true,
						title: true,
						description: true,
						startsAt: true,
						endsAt: true
					}
				}
			}
		})
	),

	listAssignableReviews: adminProcedure.query(async ({ ctx }) =>
		ctx.db.pullRequestReview.findMany({
			where: {
				isActive: true,
				task: { projectId: { not: null } }
			},
			take: 100,
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			select: {
				id: true,
				prUrl: true,
				githubTitle: true,
				status: true,
				requestedBy: { select: { id: true, name: true, email: true } },
				task: {
					select: {
						title: true,
						project: {
							select: {
								id: true,
								title: true,
								githubRepository: { select: { private: true } }
							}
						}
					}
				}
			}
		})
	),

	listAssignableProjects: adminProcedure.query(async ({ ctx }) =>
		ctx.db.project.findMany({
			where: {
				canceledAt: null,
				accessType: 'FREE',
				maxParticipants: { gt: 1 },
				OR: [
					{ githubRepositoryId: null },
					{ githubRepository: { private: false } }
				]
			},
			take: 100,
			orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
			select: { id: true, title: true, maxParticipants: true }
		})
	),

	listPeerReviewReports: adminProcedure.query(async ({ ctx }) =>
		ctx.db.cohortPeerReviewReport.findMany({
			where: { status: 'OPEN' },
			take: 100,
			orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
			select: {
				id: true,
				reason: true,
				createdAt: true,
				assignment: {
					select: {
						id: true,
						feedback: true,
						reviewer: { select: { id: true, name: true, email: true } },
						author: { select: { id: true, name: true, email: true } },
						cohort: { select: { id: true, name: true } },
						pullRequestReview: {
							select: { githubTitle: true, prUrl: true }
						}
					}
				},
				reporter: { select: { id: true, name: true, email: true } }
			}
		})
	),

	create: adminProcedure
		.input(createCohortSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.cohort.create({
				data: {
					name: input.name,
					description: input.description?.trim() || null,
					startsAt: input.startsAt,
					endsAt: input.endsAt ?? null,
					createdById: ctx.session.userId
				},
				select: { id: true, name: true, status: true }
			})
		),

	update: adminProcedure
		.input(updateCohortSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.cohort.update({
				where: { id: input.id },
				data: {
					name: input.name,
					description: input.description?.trim() || null,
					startsAt: input.startsAt,
					endsAt: input.endsAt ?? null,
					status: input.status
				},
				select: { id: true, name: true, status: true }
			})
		),

	createEvent: adminProcedure
		.input(createCohortEventSchema)
		.mutation(async ({ ctx, input }) => {
			const cohort = await ctx.db.cohort.findUnique({
				where: { id: input.cohortId },
				select: { status: true, startsAt: true, endsAt: true }
			});
			if (!cohort) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Cohort not found'
				});
			}
			if (cohort.status === 'COMPLETED' || cohort.status === 'ARCHIVED') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Completed or archived cohorts cannot receive events'
				});
			}
			if (
				input.startsAt < cohort.startsAt ||
				(cohort.endsAt && input.startsAt > cohort.endsAt) ||
				(input.endsAt && cohort.endsAt && input.endsAt > cohort.endsAt)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cohort events must stay within the cohort dates'
				});
			}

			return ctx.db.cohortEvent.create({
				data: {
					cohortId: input.cohortId,
					type: input.type,
					title: input.title,
					description: input.description?.trim() || null,
					startsAt: input.startsAt,
					endsAt: input.endsAt ?? null,
					createdById: ctx.session.userId
				},
				select: { id: true, type: true, status: true }
			});
		}),

	updateEvent: adminProcedure
		.input(updateCohortEventSchema)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.db.cohortEvent.findUnique({
				where: { id: input.id },
				select: {
					cohort: { select: { status: true, startsAt: true, endsAt: true } }
				}
			});
			if (!event) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Cohort event not found'
				});
			}
			if (
				event.cohort.status === 'COMPLETED' ||
				event.cohort.status === 'ARCHIVED'
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Completed or archived cohorts cannot change events'
				});
			}
			if (
				input.startsAt < event.cohort.startsAt ||
				(event.cohort.endsAt && input.startsAt > event.cohort.endsAt) ||
				(input.endsAt &&
					event.cohort.endsAt &&
					input.endsAt > event.cohort.endsAt)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cohort events must stay within the cohort dates'
				});
			}

			return ctx.db.cohortEvent.update({
				where: { id: input.id },
				data: {
					type: input.type,
					title: input.title,
					description: input.description?.trim() || null,
					startsAt: input.startsAt,
					endsAt: input.endsAt ?? null
				},
				select: { id: true, type: true, status: true }
			});
		}),

	completeEvent: adminProcedure
		.input(completeCohortEventSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.$transaction(async (db) => {
				const event = await db.cohortEvent.findUnique({
					where: { id: input.eventId },
					select: { id: true, type: true, status: true, cohortId: true }
				});
				if (!event) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Cohort event not found'
					});
				}
				if (event.status !== 'PLANNED') {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Only planned cohort events can be completed'
					});
				}
				const completedEvent = await db.cohortEvent.update({
					where: { id: event.id },
					data: { status: 'COMPLETED' },
					select: { id: true, type: true, status: true }
				});
				if (event.type === 'CLOSURE') {
					await db.cohort.update({
						where: { id: event.cohortId },
						data: { status: 'COMPLETED' }
					});
				}
				return completedEvent;
			})
		),

	getMyCohortTimeline: protectedProcedure.query(async ({ ctx }) =>
		ctx.db.cohortEvent.findMany({
			where: {
				cohort: {
					status: { in: ['ACTIVE', 'COMPLETED'] },
					memberships: {
						some: { userId: ctx.session.userId, status: 'ACTIVE' }
					}
				}
			},
			take: 100,
			orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
			select: {
				id: true,
				type: true,
				status: true,
				title: true,
				description: true,
				startsAt: true,
				endsAt: true,
				cohort: { select: { id: true, name: true, status: true } }
			}
		})
	),

	addMember: adminProcedure
		.input(cohortMemberSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.$transaction(async (db) => {
				const [cohort, user, projects] = await Promise.all([
					db.cohort.findUnique({
						where: { id: input.cohortId },
						select: { id: true, status: true }
					}),
					db.user.findUnique({
						where: { id: input.userId },
						select: { id: true }
					}),
					db.cohortProject.findMany({
						where: { cohortId: input.cohortId },
						select: {
							projectId: true,
							project: {
								select: {
									maxParticipants: true,
									memberships: {
										where: { status: 'ACTIVE' },
										select: { userId: true }
									}
								}
							}
						}
					})
				]);
				if (!cohort || !user) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Cohort or user not found'
					});
				}
				if (cohort.status === 'COMPLETED' || cohort.status === 'ARCHIVED') {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Completed or archived cohorts cannot receive new members'
					});
				}
				for (const cohortProject of projects) {
					const alreadyMember = cohortProject.project.memberships.some(
						(membership) => membership.userId === input.userId
					);
					if (
						!alreadyMember &&
						cohortProject.project.memberships.length >=
							cohortProject.project.maxParticipants
					) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: 'The cohort project has no room for another member'
						});
					}
				}

				const membership = await db.cohortMembership.findUnique({
					where: {
						cohortId_userId: { cohortId: input.cohortId, userId: input.userId }
					},
					select: { id: true }
				});
				const result = membership
					? await db.cohortMembership.update({
							where: { id: membership.id },
							data: { status: 'ACTIVE' },
							select: { id: true, status: true }
						})
					: await db.cohortMembership.create({
							data: { cohortId: input.cohortId, userId: input.userId },
							select: { id: true, status: true }
						});

				for (const cohortProject of projects) {
					await db.projectMembership.upsert({
						where: {
							projectId_userId: {
								projectId: cohortProject.projectId,
								userId: input.userId
							}
						},
						create: {
							projectId: cohortProject.projectId,
							userId: input.userId,
							role: 'LEARNER'
						},
						update: { role: 'LEARNER', status: 'ACTIVE', joinedAt: new Date() }
					});
				}
				return result;
			})
		),

	removeMember: adminProcedure
		.input(cohortMemberSchema)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db.cohortMembership.updateMany({
				where: {
					cohortId: input.cohortId,
					userId: input.userId,
					status: 'ACTIVE'
				},
				data: { status: 'INACTIVE' }
			});
			if (result.count === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Active membership not found'
				});
			}
			return { removed: true };
		}),

	assignProject: adminProcedure
		.input(assignCohortProjectSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.$transaction(async (db) => {
				const [cohort, project] = await Promise.all([
					db.cohort.findUnique({
						where: { id: input.cohortId },
						select: {
							status: true,
							memberships: {
								where: { status: 'ACTIVE' },
								select: { userId: true }
							}
						}
					}),
					db.project.findUnique({
						where: { id: input.projectId },
						select: {
							id: true,
							title: true,
							accessType: true,
							maxParticipants: true,
							canceledAt: true,
							githubRepository: { select: { private: true } },
							memberships: {
								where: { status: 'ACTIVE' },
								select: { userId: true }
							}
						}
					})
				]);

				if (!cohort || !project) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Cohort or project not found'
					});
				}
				if (cohort.status === 'COMPLETED' || cohort.status === 'ARCHIVED') {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Completed or archived cohorts cannot receive projects'
					});
				}
				if (
					project.canceledAt ||
					project.accessType !== 'FREE' ||
					project.githubRepository?.private
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Only active free projects can be assigned to a cohort'
					});
				}

				const existing = await db.cohortProject.findUnique({
					where: { projectId: input.projectId },
					select: { id: true }
				});
				if (existing) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'This project is already assigned to a cohort'
					});
				}

				const projectMemberIds = new Set(
					project.memberships.map((membership) => membership.userId)
				);
				const newMemberIds = cohort.memberships
					.map((membership) => membership.userId)
					.filter((userId) => !projectMemberIds.has(userId));
				if (
					project.memberships.length + newMemberIds.length >
					project.maxParticipants
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'The project cannot fit all active cohort members'
					});
				}

				const cohortProject = await db.cohortProject.create({
					data: {
						cohortId: input.cohortId,
						projectId: input.projectId,
						assignedById: ctx.session.userId
					},
					select: { id: true }
				});
				for (const userId of newMemberIds) {
					await db.projectMembership.upsert({
						where: {
							projectId_userId: { projectId: input.projectId, userId }
						},
						create: {
							projectId: input.projectId,
							userId,
							role: 'LEARNER'
						},
						update: { role: 'LEARNER', status: 'ACTIVE', joinedAt: new Date() }
					});
				}

				return {
					id: cohortProject.id,
					projectId: project.id,
					enrolledMembers: newMemberIds.length
				};
			})
		),

	listPeerReviewSuggestions: adminProcedure
		.input(listPeerReviewSuggestionsSchema)
		.query(async ({ ctx, input }) => {
			const [cohort, review, existingAssignments] = await Promise.all([
				ctx.db.cohort.findUnique({
					where: { id: input.cohortId },
					select: {
						status: true,
						memberships: {
							where: { status: 'ACTIVE' },
							take: 100,
							select: {
								userId: true,
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										weeklyAvailabilityBand: true
									}
								}
							}
						}
					}
				}),
				ctx.db.pullRequestReview.findUnique({
					where: { id: input.pullRequestReviewId },
					select: {
						requestedById: true,
						task: {
							select: {
								projectId: true,
								project: {
									select: {
										githubRepository: { select: { private: true } },
										memberships: {
											where: { status: 'ACTIVE' },
											select: { userId: true, role: true }
										},
										learningOutcomes: {
											take: 50,
											select: {
												competencies: { select: { competencyId: true } }
											}
										},
										milestones: {
											take: 50,
											select: {
												competencies: { select: { competencyId: true } }
											}
										}
									}
								}
							}
						},
						analyses: {
							where: { status: 'COMPLETED' },
							take: 20,
							select: {
								findings: {
									where: { decision: { not: 'DISCARDED' } },
									take: 100,
									select: { category: true, editedCategory: true }
								}
							}
						}
					}
				}),
				ctx.db.cohortPeerReview.findMany({
					where: {
						cohortId: input.cohortId,
						pullRequestReviewId: input.pullRequestReviewId
					},
					take: 100,
					select: { reviewerId: true }
				})
			]);

			if (!cohort || !review) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Cohort or review not found'
				});
			}
			if (cohort.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only active cohorts can receive peer reviews'
				});
			}
			if (!review.task.projectId || !review.task.project) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only project reviews can receive suggestions'
				});
			}

			const candidateIds = cohort.memberships
				.map(({ userId }) => userId)
				.filter((userId) => userId !== review.requestedById);
			if (candidateIds.length === 0) return [];

			const targetCategories = new Set(
				review.analyses.flatMap((analysis) =>
					analysis.findings.map(
						(finding) => finding.editedCategory ?? finding.category
					)
				)
			);
			const targetCompetencyIds = new Set([
				...review.task.project.learningOutcomes.flatMap((outcome) =>
					outcome.competencies.map(({ competencyId }) => competencyId)
				),
				...review.task.project.milestones.flatMap((milestone) =>
					milestone.competencies.map(({ competencyId }) => competencyId)
				)
			]);

			const [workloadGroups, competencies, calibrations, projectConflicts] =
				await Promise.all([
					ctx.db.cohortPeerReview.findMany({
						where: {
							reviewerId: { in: candidateIds },
							status: 'ASSIGNED'
						},
						take: 500,
						select: { reviewerId: true }
					}),
					ctx.db.competency.findMany({
						where: { isActive: true },
						take: 100,
						select: {
							id: true,
							reviewCategories: { select: { category: true } },
							mentorAssessments: {
								where: {
									learnerId: { in: candidateIds },
									state: 'DEMONSTRATED'
								},
								take: 100,
								select: { learnerId: true }
							}
						}
					}),
					ctx.db.cohortPeerReviewCalibration.findMany({
						where: {
							cohortId: input.cohortId,
							reviewerId: { in: candidateIds },
							version: PEER_REVIEW_CALIBRATION_VERSION,
							passed: true
						},
						take: 100,
						select: { reviewerId: true }
					}),
					ctx.db.cohortPeerReview.findMany({
						where: {
							reviewerId: { in: candidateIds },
							status: { in: ['ASSIGNED', 'SUBMITTED'] },
							pullRequestReview: {
								task: { projectId: review.task.projectId }
							}
						},
						take: 100,
						select: { reviewerId: true }
					})
				]);

			const activeAssignments = new Map<string, number>();
			for (const assignment of workloadGroups) {
				activeAssignments.set(
					assignment.reviewerId,
					(activeAssignments.get(assignment.reviewerId) ?? 0) + 1
				);
			}
			const demonstratedCompetencies = new Map<string, number>();
			for (const competency of competencies) {
				const matchesTarget =
					targetCompetencyIds.has(competency.id) ||
					competency.reviewCategories.some(({ category }) =>
						targetCategories.has(category)
					);
				if (!matchesTarget) continue;
				for (const assessment of competency.mentorAssessments) {
					demonstratedCompetencies.set(
						assessment.learnerId,
						(demonstratedCompetencies.get(assessment.learnerId) ?? 0) + 1
					);
				}
			}
			const calibratedReviewers = new Set(
				calibrations.map(({ reviewerId }) => reviewerId)
			);
			const existingReviewerIds = new Set(
				existingAssignments.map(({ reviewerId }) => reviewerId)
			);
			const projectConflictReviewers = new Set(
				projectConflicts.map(({ reviewerId }) => reviewerId)
			);
			const projectMemberships = new Map(
				review.task.project.memberships.map((membership) => [
					membership.userId,
					membership.role
				])
			);
			const projectIsPublic =
				review.task.project.githubRepository?.private === false;

			const candidateIdSet = new Set(candidateIds);
			return cohort.memberships
				.filter(({ userId }) => {
					if (!candidateIdSet.has(userId)) return false;
					if (existingReviewerIds.has(userId)) return false;
					if (projectConflictReviewers.has(userId)) return false;
					const role = projectMemberships.get(userId);
					if (role === 'OWNER' || role === 'MENTOR') return false;
					return projectIsPublic || projectMemberships.has(userId);
				})
				.map(({ userId, user }) => {
					const activeAssignmentCount = activeAssignments.get(userId) ?? 0;
					const availabilityBand = user.weeklyAvailabilityBand;
					const capacity =
						reviewerCapacityByAvailability[availabilityBand ?? 'UNDER_3'] ?? 1;
					const competencyScore = demonstratedCompetencies.get(userId) ?? 0;
					const calibrationPassed = calibratedReviewers.has(userId);
					const score =
						competencyScore * 10 +
						(calibrationPassed ? 3 : 0) +
						Math.max(0, capacity - activeAssignmentCount) * 2 -
						Math.max(0, activeAssignmentCount - capacity);
					const reasons = [
						competencyScore > 0
							? `${competencyScore} demonstrated competency match${competencyScore === 1 ? '' : 'es'}`
							: 'No demonstrated competency match recorded',
						activeAssignmentCount === 0
							? 'No active peer-review assignments'
							: `${activeAssignmentCount} active peer-review assignment${activeAssignmentCount === 1 ? '' : 's'}`,
						availabilityBand
							? `Availability band: ${availabilityBand}`
							: 'Availability band not declared',
						calibrationPassed
							? 'Calibration complete'
							: 'Needs calibration before submitting'
					];

					return {
						userId,
						name: user.name,
						email: user.email,
						score,
						competencyScore,
						activeAssignmentCount,
						availabilityBand,
						capacity,
						calibrationPassed,
						reasons
					};
				})
				.sort(
					(a, b) =>
						b.score - a.score ||
						a.activeAssignmentCount - b.activeAssignmentCount ||
						(a.name ?? a.email).localeCompare(b.name ?? b.email) ||
						a.userId.localeCompare(b.userId)
				)
				.slice(0, MAX_PEER_REVIEW_SUGGESTIONS);
		}),

	assignPeerReview: adminProcedure
		.input(assignPeerReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const [cohort, review] = await Promise.all([
				ctx.db.cohort.findUnique({
					where: { id: input.cohortId },
					select: {
						status: true,
						memberships: {
							where: {
								status: 'ACTIVE',
								userId: { in: [input.reviewerId] }
							},
							select: { userId: true }
						}
					}
				}),
				ctx.db.pullRequestReview.findUnique({
					where: { id: input.pullRequestReviewId },
					select: {
						requestedById: true,
						isActive: true,
						task: {
							select: {
								projectId: true,
								project: {
									select: {
										githubRepository: { select: { private: true } },
										memberships: {
											where: {
												userId: input.reviewerId,
												status: 'ACTIVE'
											},
											select: { id: true }
										}
									}
								}
							}
						}
					}
				})
			]);

			if (!cohort || !review) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Cohort or review not found'
				});
			}
			if (cohort.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only active cohorts can receive peer reviews'
				});
			}
			if (!review.isActive || !review.task.projectId || !review.task.project) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only active project reviews can receive peer reviews'
				});
			}
			if (review.requestedById === input.reviewerId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'A learner cannot review their own pull request'
				});
			}
			const authorMembership = await ctx.db.cohortMembership.findUnique({
				where: {
					cohortId_userId: {
						cohortId: input.cohortId,
						userId: review.requestedById
					}
				},
				select: { userId: true, status: true }
			});
			if (
				cohort.memberships.length === 0 ||
				!authorMembership ||
				authorMembership.status !== 'ACTIVE'
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'The reviewer and author must be active cohort members'
				});
			}
			if (!hasPeerReviewProjectAccess(review.task.project)) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'The reviewer must belong to the project to review this repository'
				});
			}

			const existing = await ctx.db.cohortPeerReview.findUnique({
				where: {
					cohortId_pullRequestReviewId_reviewerId: {
						cohortId: input.cohortId,
						pullRequestReviewId: input.pullRequestReviewId,
						reviewerId: input.reviewerId
					}
				},
				select: { id: true }
			});
			if (existing) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This peer review is already assigned'
				});
			}

			return ctx.db.cohortPeerReview.create({
				data: {
					cohortId: input.cohortId,
					pullRequestReviewId: input.pullRequestReviewId,
					reviewerId: input.reviewerId,
					authorId: review.requestedById
				},
				select: { id: true, status: true }
			});
		}),

	getPeerReviewCalibration: protectedProcedure
		.input(getPeerReviewCalibrationSchema)
		.query(async ({ ctx, input }) => {
			const membership = await ctx.db.cohortMembership.findUnique({
				where: {
					cohortId_userId: {
						cohortId: input.cohortId,
						userId: ctx.session.userId
					}
				},
				select: { status: true }
			});
			if (!membership || membership.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You must be an active cohort member'
				});
			}

			const result = await ctx.db.cohortPeerReviewCalibration.findUnique({
				where: {
					cohortId_reviewerId_version: {
						cohortId: input.cohortId,
						reviewerId: ctx.session.userId,
						version: PEER_REVIEW_CALIBRATION_VERSION
					}
				},
				select: {
					attemptCount: true,
					score: true,
					total: true,
					passed: true
				}
			});

			return {
				version: PEER_REVIEW_CALIBRATION_VERSION,
				passed: result?.passed ?? false,
				attemptCount: result?.attemptCount ?? 0,
				score: result?.score ?? 0,
				total: result?.total ?? peerReviewCalibrationPrompts.length,
				rubric: peerReviewRubric,
				checklist: peerReviewChecklist,
				prompts: peerReviewCalibrationPrompts.map(({ id, scenario }) => ({
					id,
					scenario
				}))
			};
		}),

	completePeerReviewCalibration: protectedProcedure
		.input(completePeerReviewCalibrationSchema)
		.mutation(async ({ ctx, input }) => {
			const membership = await ctx.db.cohortMembership.findUnique({
				where: {
					cohortId_userId: {
						cohortId: input.cohortId,
						userId: ctx.session.userId
					}
				},
				select: { status: true }
			});
			if (!membership || membership.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You must be an active cohort member'
				});
			}

			const expectedCategories = new Map(
				peerReviewCalibrationPrompts.map((prompt) => [
					prompt.id,
					prompt.expectedCategory
				])
			);
			const score = input.answers.reduce(
				(total, answer) =>
					total +
					(expectedCategories.get(answer.promptId) === answer.category ? 1 : 0),
				0
			);
			const result = await ctx.db.cohortPeerReviewCalibration.upsert({
				where: {
					cohortId_reviewerId_version: {
						cohortId: input.cohortId,
						reviewerId: ctx.session.userId,
						version: PEER_REVIEW_CALIBRATION_VERSION
					}
				},
				create: {
					cohortId: input.cohortId,
					reviewerId: ctx.session.userId,
					version: PEER_REVIEW_CALIBRATION_VERSION,
					attemptCount: 1,
					score,
					total: peerReviewCalibrationPrompts.length,
					passed: score >= PEER_REVIEW_CALIBRATION_PASS_SCORE,
					completedAt: new Date()
				},
				update: {
					attemptCount: { increment: 1 },
					score,
					total: peerReviewCalibrationPrompts.length,
					passed: score >= PEER_REVIEW_CALIBRATION_PASS_SCORE,
					completedAt: new Date()
				},
				select: { attemptCount: true, score: true, total: true, passed: true }
			});

			return result;
		}),

	getMyPeerReviews: protectedProcedure.query(async ({ ctx }) => {
		const activeMembership = {
			memberships: {
				some: { userId: ctx.session.userId, status: 'ACTIVE' as const }
			}
		};
		const [assigned, received, passedCalibrations] = await Promise.all([
			ctx.db.cohortPeerReview.findMany({
				where: {
					reviewerId: ctx.session.userId,
					status: 'ASSIGNED',
					cohort: activeMembership
				},
				take: 50,
				orderBy: { createdAt: 'asc' },
				select: {
					id: true,
					cohort: { select: { id: true, name: true } },
					pullRequestReview: {
						select: {
							prUrl: true,
							githubTitle: true,
							status: true,
							task: {
								select: {
									title: true,
									project: {
										select: {
											title: true,
											githubRepository: { select: { private: true } },
											memberships: {
												where: {
													userId: ctx.session.userId,
													status: 'ACTIVE'
												},
												select: { id: true }
											}
										}
									}
								}
							}
						}
					}
				}
			}),
			ctx.db.cohortPeerReview.findMany({
				where: {
					authorId: ctx.session.userId,
					status: 'SUBMITTED',
					cohort: activeMembership
				},
				take: 50,
				orderBy: { submittedAt: 'desc' },
				select: {
					id: true,
					feedback: true,
					submittedAt: true,
					cohort: { select: { id: true, name: true } },
					reviewer: { select: { name: true } },
					pullRequestReview: {
						select: {
							prUrl: true,
							githubTitle: true,
							task: {
								select: {
									title: true,
									project: {
										select: {
											title: true,
											githubRepository: { select: { private: true } },
											memberships: {
												where: {
													userId: ctx.session.userId,
													status: 'ACTIVE'
												},
												select: { id: true }
											}
										}
									}
								}
							}
						}
					}
				}
			}),
			ctx.db.cohortPeerReviewCalibration.findMany({
				where: {
					reviewerId: ctx.session.userId,
					version: PEER_REVIEW_CALIBRATION_VERSION,
					passed: true,
					cohort: activeMembership
				},
				take: 50,
				select: { cohortId: true }
			})
		]);
		const passedCalibrationCohorts = new Set(
			(passedCalibrations ?? []).map(({ cohortId }) => cohortId)
		);

		return {
			assigned: assigned.flatMap((assignment) => {
				const project = assignment.pullRequestReview.task.project;
				if (!project || !hasPeerReviewProjectAccess(project)) {
					return [];
				}
				return [
					{
						id: assignment.id,
						cohort: assignment.cohort,
						calibrationPassed: passedCalibrationCohorts.has(
							assignment.cohort.id
						),
						review: {
							title:
								assignment.pullRequestReview.githubTitle ??
								assignment.pullRequestReview.prUrl,
							prUrl: assignment.pullRequestReview.prUrl,
							status: assignment.pullRequestReview.status,
							taskTitle: assignment.pullRequestReview.task.title,
							projectTitle: project.title
						}
					}
				];
			}),
			received: received.flatMap((assignment) => {
				const project = assignment.pullRequestReview.task.project;
				if (!project || !hasPeerReviewProjectAccess(project)) {
					return [];
				}
				return [
					{
						id: assignment.id,
						cohort: assignment.cohort,
						reviewerName: assignment.reviewer.name,
						feedback: assignment.feedback,
						submittedAt: assignment.submittedAt,
						review: {
							title:
								assignment.pullRequestReview.githubTitle ??
								assignment.pullRequestReview.prUrl,
							prUrl: assignment.pullRequestReview.prUrl,
							taskTitle: assignment.pullRequestReview.task.title,
							projectTitle: project.title
						}
					}
				];
			})
		};
	}),

	getMyCohortProjects: protectedProcedure.query(async ({ ctx }) =>
		ctx.db.cohortProject.findMany({
			where: {
				cohort: {
					memberships: {
						some: { userId: ctx.session.userId, status: 'ACTIVE' }
					}
				},
				project: {
					canceledAt: null,
					memberships: {
						some: { userId: ctx.session.userId, status: 'ACTIVE' }
					}
				}
			},
			take: 50,
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				cohort: { select: { id: true, name: true } },
				project: { select: { id: true, title: true, description: true } }
			}
		})
	),

	getMyPeerReviewReputation: protectedProcedure.query(async ({ ctx }) => {
		const [submittedCount, dismissedCount, reportedCount, openReportCount] =
			await Promise.all([
				ctx.db.cohortPeerReview.count({
					where: { reviewerId: ctx.session.userId, status: 'SUBMITTED' }
				}),
				ctx.db.cohortPeerReview.count({
					where: { reviewerId: ctx.session.userId, status: 'DISMISSED' }
				}),
				ctx.db.cohortPeerReviewReport.count({
					where: { assignment: { reviewerId: ctx.session.userId } }
				}),
				ctx.db.cohortPeerReviewReport.count({
					where: {
						status: 'OPEN',
						assignment: { reviewerId: ctx.session.userId }
					}
				})
			]);

		return {
			score: submittedCount,
			submittedCount,
			dismissedCount,
			reportedCount,
			openReportCount
		};
	}),

	submitPeerReview: protectedProcedure
		.input(submitPeerReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const assignment = await ctx.db.cohortPeerReview.findFirst({
				where: {
					id: input.assignmentId,
					reviewerId: ctx.session.userId,
					status: 'ASSIGNED',
					cohort: {
						memberships: {
							some: { userId: ctx.session.userId, status: 'ACTIVE' }
						}
					}
				},
				select: { id: true, cohortId: true }
			});
			if (!assignment) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Peer review assignment not found'
				});
			}

			const calibration = await ctx.db.cohortPeerReviewCalibration.findUnique({
				where: {
					cohortId_reviewerId_version: {
						cohortId: assignment.cohortId,
						reviewerId: ctx.session.userId,
						version: PEER_REVIEW_CALIBRATION_VERSION
					}
				},
				select: { passed: true }
			});
			if (!calibration?.passed) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Complete peer review calibration before submitting feedback'
				});
			}

			const result = await ctx.db.cohortPeerReview.updateMany({
				where: {
					id: assignment.id,
					reviewerId: ctx.session.userId,
					status: 'ASSIGNED'
				},
				data: {
					status: 'SUBMITTED',
					feedback: input.feedback,
					submittedAt: new Date()
				}
			});
			if (result.count === 0) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This peer review was already submitted'
				});
			}
			return { submitted: true };
		}),

	reportPeerReview: protectedProcedure
		.input(reportPeerReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const assignment = await ctx.db.cohortPeerReview.findFirst({
				where: {
					id: input.assignmentId,
					authorId: ctx.session.userId,
					status: 'SUBMITTED',
					cohort: {
						memberships: {
							some: { userId: ctx.session.userId, status: 'ACTIVE' }
						}
					}
				},
				select: { id: true }
			});
			if (!assignment) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Submitted peer review not found'
				});
			}

			const existing = await ctx.db.cohortPeerReviewReport.findUnique({
				where: {
					assignmentId_reporterId: {
						assignmentId: assignment.id,
						reporterId: ctx.session.userId
					}
				},
				select: { id: true }
			});
			if (existing) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'You have already reported this peer review'
				});
			}

			return ctx.db.cohortPeerReviewReport.create({
				data: {
					assignmentId: assignment.id,
					reporterId: ctx.session.userId,
					reason: input.reason
				},
				select: { id: true, status: true }
			});
		}),

	resolvePeerReviewReport: adminProcedure
		.input(resolvePeerReviewReportSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.$transaction(async (db) => {
				const report = await db.cohortPeerReviewReport.findUnique({
					where: { id: input.reportId },
					select: { id: true, assignmentId: true, status: true }
				});
				if (!report || report.status !== 'OPEN') {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Open peer review report not found'
					});
				}

				const resolvedAt = new Date();
				if (input.status === 'RESOLVED') {
					await db.cohortPeerReview.update({
						where: { id: report.assignmentId },
						data: {
							status: 'DISMISSED',
							dismissedAt: resolvedAt,
							dismissedById: ctx.session.userId
						}
					});
				}
				return db.cohortPeerReviewReport.update({
					where: { id: report.id },
					data: {
						status: input.status,
						resolutionNote: input.resolutionNote?.trim() || null,
						resolvedAt,
						resolvedById: ctx.session.userId
					},
					select: { id: true, status: true }
				});
			})
		),

	dismissPeerReview: adminProcedure
		.input(cohortPeerReviewIdSchema)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db.cohortPeerReview.updateMany({
				where: {
					id: input.assignmentId,
					status: { in: ['ASSIGNED', 'SUBMITTED'] }
				},
				data: {
					status: 'DISMISSED',
					dismissedAt: new Date(),
					dismissedById: ctx.session.userId
				}
			});
			if (result.count === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Active peer review not found'
				});
			}
			return { dismissed: true };
		})
});
