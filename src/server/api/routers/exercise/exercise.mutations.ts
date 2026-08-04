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
	notifyExercisePrUpdatedSchema,
	reorderExerciseChallengesSchema,
	requestExerciseReviewSchema,
	updateExerciseChallengeSchema,
	updateExerciseTrackSchema
} from '~/features/exercises/schemas/exercise.schema';
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
				select: { id: true }
			});

			if (!track) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Track not found'
				});
			}

			const challenges = await ctx.db.exerciseChallenge.findMany({
				where: {
					id: { in: uniqueChallengeIds },
					trackId: track.id,
					isArchived: false
				},
				select: { id: true, trackId: true, title: true }
			});

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

			const now = new Date();

			return ctx.db.$transaction(async (tx) => {
				const submission = await tx.exerciseReviewSubmission.create({
					data: {
						prUrl: input.prUrl,
						trackId: track.id,
						submittedById: userId,
						needsAttention: true,
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

				return submission;
			});
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
					decisions: {
						select: {
							id: true,
							status: true,
							challengeId: true
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
					message:
						'This submission has no challenges awaiting your PR update'
				});
			}

			return ctx.db.$transaction(async (tx) => {
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

			const progressStatus =
				input.status === ExerciseReviewDecisionStatus.APPROVED
					? UserChallengeProgressStatus.APPROVED
					: UserChallengeProgressStatus.CHANGES_REQUESTED;

			const remainingPending = decision.submission.decisions.some(
				(item) =>
					item.id !== decision.id &&
					item.status === ExerciseReviewDecisionStatus.PENDING
			);

			return ctx.db.$transaction(async (tx) => {
				const updated = await tx.exerciseReviewDecision.update({
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

				return updated;
			});
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
