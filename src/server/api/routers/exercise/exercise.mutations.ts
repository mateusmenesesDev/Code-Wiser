import {
	ExerciseReviewDecisionStatus,
	UserChallengeProgressStatus
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { slugify } from '~/features/exercises/lib/slugify';
import {
	createExerciseChallengeSchema,
	createExerciseTrackSchema,
	decideExerciseReviewSchema,
	exerciseChallengeIdSchema,
	exerciseTrackIdSchema,
	githubRepoPathFromPullRequestUrl,
	githubRepoPathFromUrl,
	notifyExercisePrUpdatedSchema,
	reorderExerciseChallengesSchema,
	requestExerciseReviewSchema,
	updateExerciseChallengeSchema,
	updateExerciseTrackSchema
} from '~/features/exercises/schemas/exercise.schema';
import {
	notifyExerciseChallengeResponse,
	notifyExercisePrUpdated,
	notifyExerciseReviewRequested
} from '~/server/services/notification/exerciseNotifications';
import {
	GitHubServiceError,
	getPullRequestSnapshotForRepository
} from '~/server/services/github/github';
import {
	adminProcedure,
	mentorshipProcedure,
	protectedProcedure
} from '../../trpc';

const ACTIVE_REVIEW_STATUSES: UserChallengeProgressStatus[] = [
	UserChallengeProgressStatus.IN_REVIEW,
	UserChallengeProgressStatus.CHANGES_REQUESTED
];

async function ensureUniqueTrackSlug(
	db: {
		exerciseTrack: {
			findUnique: (args: {
				where: { slug: string };
			}) => Promise<{ id: string } | null>;
		};
	},
	baseSlug: string,
	excludeId?: string
): Promise<string> {
	let candidate = baseSlug || 'track';
	let suffix = 2;

	while (true) {
		const existing = await db.exerciseTrack.findUnique({
			where: { slug: candidate }
		});
		if (!existing || existing.id === excludeId) {
			return candidate;
		}
		candidate = `${baseSlug || 'track'}-${suffix}`;
		suffix += 1;
	}
}

async function ensureUniqueChallengeSlug(
	db: {
		exerciseChallenge: {
			findUnique: (args: {
				where: { trackId_slug: { trackId: string; slug: string } };
			}) => Promise<{ id: string } | null>;
		};
	},
	trackId: string,
	baseSlug: string,
	excludeId?: string
): Promise<string> {
	let candidate = baseSlug || 'challenge';
	let suffix = 2;

	while (true) {
		const existing = await db.exerciseChallenge.findUnique({
			where: { trackId_slug: { trackId, slug: candidate } }
		});
		if (!existing || existing.id === excludeId) {
			return candidate;
		}
		candidate = `${baseSlug || 'challenge'}-${suffix}`;
		suffix += 1;
	}
}

export const exerciseMutations = {
	startChallenge: protectedProcedure
		.input(exerciseChallengeIdSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			if (!userId) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const challenge = await ctx.db.exerciseChallenge.findFirst({
				where: {
					id: input.id,
					isArchived: false,
					track: {
						isPublished: true,
						isArchived: false
					}
				},
				select: { id: true }
			});

			if (!challenge) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Challenge not found'
				});
			}

			const existing = await ctx.db.userChallengeProgress.findUnique({
				where: {
					userId_challengeId: {
						userId,
						challengeId: challenge.id
					}
				}
			});

			if (existing) {
				return existing;
			}

			return ctx.db.userChallengeProgress.create({
				data: {
					userId,
					challengeId: challenge.id,
					status: UserChallengeProgressStatus.IN_PROGRESS,
					startedAt: new Date()
				}
			});
		}),

	requestReview: mentorshipProcedure
		.input(requestExerciseReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			if (!userId) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const uniqueChallengeIds = [...new Set(input.challengeIds)];

			const track = await ctx.db.exerciseTrack.findFirst({
				where: {
					id: input.trackId,
					isPublished: true,
					isArchived: false
				},
				select: {
					id: true,
					name: true,
					repoUrl: true,
					githubRepository: {
						select: {
							id: true,
							owner: true,
							name: true,
							installation: {
								select: { githubInstallationId: true, active: true }
							}
						}
					}
				}
			});

			if (!track) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Track not found'
				});
			}

			const trackRepoPath = githubRepoPathFromUrl(track.repoUrl);
			const prRepoPath = githubRepoPathFromPullRequestUrl(input.prUrl);
			if (trackRepoPath && prRepoPath && trackRepoPath !== prRepoPath) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'PR URL must belong to this track repository'
				});
			}

			const [challenges, member] = await Promise.all([
				ctx.db.exerciseChallenge.findMany({
					where: {
						id: { in: uniqueChallengeIds },
						trackId: track.id,
						isArchived: false
					},
					select: { id: true, trackId: true, title: true }
				}),
				ctx.db.user.findUnique({
					where: { id: userId },
					select: { name: true }
				})
			]);

			if (challenges.length !== uniqueChallengeIds.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'All selected challenges must belong to this published track'
				});
			}

			const activeProgress = await ctx.db.userChallengeProgress.findMany({
				where: {
					userId,
					challengeId: { in: uniqueChallengeIds },
					status: { in: ACTIVE_REVIEW_STATUSES }
				},
				select: { challengeId: true, status: true }
			});

			if (activeProgress.length > 0) {
				const activeIds = new Set(
					activeProgress.map((progress) => progress.challengeId)
				);
				const conflictingTitles = challenges
					.filter((challenge) => activeIds.has(challenge.id))
					.map((challenge) => challenge.title);

				throw new TRPCError({
					code: 'CONFLICT',
					message: `These challenges already have an active review cycle (In review or Changes requested): ${conflictingTitles.join(', ')}`
				});
			}

			let submissionUrl = input.prUrl;
			let githubSnapshot: Awaited<
				ReturnType<typeof getPullRequestSnapshotForRepository>
			> | null = null;
			if (track.githubRepository) {
				try {
					githubSnapshot = await getPullRequestSnapshotForRepository(
						track.githubRepository,
						input.prUrl
					);
					submissionUrl = githubSnapshot.htmlUrl;
				} catch (error) {
					if (error instanceof GitHubServiceError) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: error.message
						});
					}
					throw error;
				}
			}

			const now = new Date();

			const submission = await ctx.db.$transaction(async (tx) => {
				const created = await tx.exerciseReviewSubmission.create({
					data: {
						prUrl: submissionUrl,
						trackId: track.id,
						submittedById: userId,
						needsAttention: true,
						...(githubSnapshot
							? {
									githubRepositoryId: track.githubRepository?.id,
									githubPullRequestNumber: githubSnapshot.number,
									githubTitle: githubSnapshot.title,
									githubState: githubSnapshot.state,
									githubAuthorLogin: githubSnapshot.authorLogin,
									githubCommitCount: githubSnapshot.commitCount,
									githubHeadSha: githubSnapshot.headSha,
									githubChecksStatus: githubSnapshot.checksStatus,
									githubLastSyncedAt: new Date()
								}
							: {}),
						decisions: {
							create: uniqueChallengeIds.map((challengeId) => ({
								challengeId,
								status: ExerciseReviewDecisionStatus.PENDING
							}))
						}
					},
					include: {
						decisions: true
					}
				});

				for (const challengeId of uniqueChallengeIds) {
					await tx.userChallengeProgress.upsert({
						where: {
							userId_challengeId: {
								userId,
								challengeId
							}
						},
						create: {
							userId,
							challengeId,
							status: UserChallengeProgressStatus.IN_REVIEW,
							startedAt: now
						},
						update: {
							status: UserChallengeProgressStatus.IN_REVIEW
						}
					});
				}

				return created;
			});

			await notifyExerciseReviewRequested({
				db: ctx.db,
				memberName: member?.name ?? null,
				submissionId: submission.id,
				trackName: track.name,
				challengeTitles: challenges.map((challenge) => challenge.title),
				prUrl: submissionUrl
			}).catch((error) => {
				console.error('Failed to send exercise review notification:', error);
			});

			return submission;
		}),

	notifyPrUpdated: mentorshipProcedure
		.input(notifyExercisePrUpdatedSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			if (!userId) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const submission = await ctx.db.exerciseReviewSubmission.findFirst({
				where: {
					id: input.submissionId,
					submittedById: userId
				},
				include: {
					track: { select: { name: true } },
					submittedBy: { select: { name: true } },
					decisions: {
						select: {
							id: true,
							status: true,
							challengeId: true,
							challenge: { select: { title: true } }
						}
					}
				}
			});

			if (!submission) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Review submission not found'
				});
			}

			const changesRequested = submission.decisions.filter(
				(decision) =>
					decision.status === ExerciseReviewDecisionStatus.CHANGES_REQUESTED
			);

			if (changesRequested.length === 0) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'This submission has no challenges awaiting your PR update'
				});
			}

			const updated = await ctx.db.$transaction(async (tx) => {
				for (const decision of changesRequested) {
					await tx.exerciseReviewDecision.update({
						where: { id: decision.id },
						data: {
							status: ExerciseReviewDecisionStatus.PENDING,
							reviewedAt: null,
							reviewedById: null
						}
					});

					await tx.userChallengeProgress.update({
						where: {
							userId_challengeId: {
								userId,
								challengeId: decision.challengeId
							}
						},
						data: { status: UserChallengeProgressStatus.IN_REVIEW }
					});
				}

				return tx.exerciseReviewSubmission.update({
					where: { id: submission.id },
					data: {
						needsAttention: true,
						updateNote: input.updateNote?.trim() || null
					}
				});
			});

			await notifyExercisePrUpdated({
				db: ctx.db,
				memberName: submission.submittedBy.name,
				submissionId: submission.id,
				trackName: submission.track.name,
				challengeTitles: changesRequested.map(
					(decision) => decision.challenge.title
				),
				updateNote: input.updateNote
			}).catch((error) => {
				console.error('Failed to send exercise PR update notification:', error);
			});

			return updated;
		}),

	decideChallengeReview: adminProcedure
		.input(decideExerciseReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const reviewerId = ctx.session.userId;
			if (!reviewerId) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const decision = await ctx.db.exerciseReviewDecision.findUnique({
				where: { id: input.decisionId },
				include: {
					challenge: {
						select: {
							title: true,
							slug: true,
							track: { select: { slug: true } }
						}
					},
					submission: {
						select: {
							id: true,
							submittedById: true,
							decisions: {
								select: { id: true, status: true }
							}
						}
					}
				}
			});

			if (!decision) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Review decision not found'
				});
			}

			if (decision.status !== ExerciseReviewDecisionStatus.PENDING) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This challenge has already been reviewed'
				});
			}

			const progressStatus =
				input.status === ExerciseReviewDecisionStatus.APPROVED
					? UserChallengeProgressStatus.APPROVED
					: UserChallengeProgressStatus.CHANGES_REQUESTED;

			const remainingPending = decision.submission.decisions.some(
				(item) =>
					item.id !== decision.id &&
					item.status === ExerciseReviewDecisionStatus.PENDING
			);

			const mentor = await ctx.db.user.findUnique({
				where: { id: reviewerId },
				select: { name: true }
			});

			const updated = await ctx.db.$transaction(async (tx) => {
				const saved = await tx.exerciseReviewDecision.update({
					where: { id: decision.id },
					data: {
						status: input.status,
						mentorComment: input.mentorComment?.trim() || null,
						reviewedAt: new Date(),
						reviewedById: reviewerId
					}
				});

				await tx.userChallengeProgress.update({
					where: {
						userId_challengeId: {
							userId: decision.submission.submittedById,
							challengeId: decision.challengeId
						}
					},
					data: { status: progressStatus }
				});

				await tx.exerciseReviewSubmission.update({
					where: { id: decision.submission.id },
					data: { needsAttention: remainingPending }
				});

				return saved;
			});

			await notifyExerciseChallengeResponse({
				db: ctx.db,
				memberId: decision.submission.submittedById,
				mentorName: mentor?.name,
				challengeTitle: decision.challenge.title,
				trackSlug: decision.challenge.track.slug,
				challengeSlug: decision.challenge.slug,
				status: input.status,
				mentorComment: input.mentorComment
			}).catch((error) => {
				console.error(
					'Failed to send exercise challenge response notification:',
					error
				);
			});

			return updated;
		}),

	createTrack: adminProcedure
		.input(createExerciseTrackSchema)
		.mutation(async ({ ctx, input }) => {
			const baseSlug = input.slug ?? slugify(input.name);
			const slug = await ensureUniqueTrackSlug(ctx.db, baseSlug);

			return ctx.db.exerciseTrack.create({
				data: {
					name: input.name,
					description: input.description,
					repoUrl: input.repoUrl ?? '',
					slug,
					sortOrder: input.sortOrder ?? 0,
					isPublished: input.isPublished ?? false
				}
			});
		}),

	updateTrack: adminProcedure
		.input(updateExerciseTrackSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.exerciseTrack.findUnique({
				where: { id: input.id }
			});

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Track not found'
				});
			}

			const nextName = input.name ?? existing.name;
			const baseSlug =
				input.slug ?? (input.name ? slugify(input.name) : existing.slug);
			const slug =
				baseSlug === existing.slug
					? existing.slug
					: await ensureUniqueTrackSlug(ctx.db, baseSlug, existing.id);

			return ctx.db.exerciseTrack.update({
				where: { id: input.id },
				data: {
					name: nextName,
					description: input.description ?? existing.description,
					repoUrl: input.repoUrl ?? existing.repoUrl,
					slug,
					sortOrder: input.sortOrder ?? existing.sortOrder,
					isPublished: input.isPublished ?? existing.isPublished,
					isArchived: input.isArchived ?? existing.isArchived
				}
			});
		}),

	archiveTrack: adminProcedure
		.input(exerciseTrackIdSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.exerciseTrack.findUnique({
				where: { id: input.id }
			});

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Track not found'
				});
			}

			return ctx.db.exerciseTrack.update({
				where: { id: input.id },
				data: { isArchived: true, isPublished: false }
			});
		}),

	createChallenge: adminProcedure
		.input(createExerciseChallengeSchema)
		.mutation(async ({ ctx, input }) => {
			const track = await ctx.db.exerciseTrack.findUnique({
				where: { id: input.trackId }
			});

			if (!track || track.isArchived) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Track not found'
				});
			}

			const baseSlug = input.slug ?? slugify(input.title);
			const slug = await ensureUniqueChallengeSlug(
				ctx.db,
				input.trackId,
				baseSlug
			);

			return ctx.db.exerciseChallenge.create({
				data: {
					trackId: input.trackId,
					title: input.title,
					slug,
					difficulty: input.difficulty,
					description: input.description,
					setupInstructions: input.setupInstructions,
					acceptanceCriteria: input.acceptanceCriteria,
					sortOrder: input.sortOrder ?? 0
				}
			});
		}),

	updateChallenge: adminProcedure
		.input(updateExerciseChallengeSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.exerciseChallenge.findUnique({
				where: { id: input.id }
			});

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Challenge not found'
				});
			}

			const nextTitle = input.title ?? existing.title;
			const baseSlug =
				input.slug ?? (input.title ? slugify(input.title) : existing.slug);
			const slug =
				baseSlug === existing.slug
					? existing.slug
					: await ensureUniqueChallengeSlug(
							ctx.db,
							existing.trackId,
							baseSlug,
							existing.id
						);

			return ctx.db.exerciseChallenge.update({
				where: { id: input.id },
				data: {
					title: nextTitle,
					slug,
					difficulty: input.difficulty ?? existing.difficulty,
					description: input.description ?? existing.description,
					setupInstructions:
						input.setupInstructions ?? existing.setupInstructions,
					acceptanceCriteria:
						input.acceptanceCriteria ?? existing.acceptanceCriteria,
					sortOrder: input.sortOrder ?? existing.sortOrder,
					isArchived: input.isArchived ?? existing.isArchived
				}
			});
		}),

	archiveChallenge: adminProcedure
		.input(exerciseChallengeIdSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.exerciseChallenge.findUnique({
				where: { id: input.id }
			});

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Challenge not found'
				});
			}

			return ctx.db.exerciseChallenge.update({
				where: { id: input.id },
				data: { isArchived: true }
			});
		}),

	reorderChallenges: adminProcedure
		.input(reorderExerciseChallengesSchema)
		.mutation(async ({ ctx, input }) => {
			const challenges = await ctx.db.exerciseChallenge.findMany({
				where: {
					trackId: input.trackId,
					difficulty: input.difficulty,
					isArchived: false
				},
				select: { id: true }
			});

			const existingIds = new Set(challenges.map((c) => c.id));
			if (
				input.orderedChallengeIds.length !== existingIds.size ||
				input.orderedChallengeIds.some((id) => !existingIds.has(id))
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message:
						'orderedChallengeIds must include exactly the non-archived challenges for this difficulty'
				});
			}

			await ctx.db.$transaction(
				input.orderedChallengeIds.map((id, index) =>
					ctx.db.exerciseChallenge.update({
						where: { id },
						data: { sortOrder: index }
					})
				)
			);

			return { success: true as const };
		})
};
