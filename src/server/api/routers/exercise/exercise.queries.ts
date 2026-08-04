import { UserChallengeProgressStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
	exerciseChallengeSlugSchema,
	exerciseReviewSubmissionIdSchema,
	exerciseTrackIdSchema,
	exerciseTrackSlugSchema
} from '~/features/exercises/schemas/exercise.schema';
import { adminProcedure, publicProcedure } from '../../trpc';

const DIFFICULTY_ORDER = {
	EASY: 0,
	MEDIUM: 1,
	HARD: 2
} as const;

function resolveProgressStatus(
	status: UserChallengeProgressStatus | undefined
): UserChallengeProgressStatus {
	return status ?? UserChallengeProgressStatus.NOT_STARTED;
}

function sortChallengesByDifficultyThenOrder<
	T extends { difficulty: keyof typeof DIFFICULTY_ORDER; sortOrder: number }
>(challenges: T[]): T[] {
	return [...challenges].sort((a, b) => {
		const difficultyDiff =
			DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
		if (difficultyDiff !== 0) return difficultyDiff;
		return a.sortOrder - b.sortOrder;
	});
}

export const exerciseQueries = {
	listPublishedTracks: publicProcedure.query(async ({ ctx }) => {
		const tracks = await ctx.db.exerciseTrack.findMany({
			where: { isPublished: true, isArchived: false },
			orderBy: { sortOrder: 'asc' },
			select: {
				id: true,
				name: true,
				slug: true,
				description: true,
				sortOrder: true,
				_count: {
					select: {
						challenges: {
							where: { isArchived: false }
						}
					}
				}
			}
		});

		return tracks.map((track) => ({
			id: track.id,
			name: track.name,
			slug: track.slug,
			description: track.description,
			sortOrder: track.sortOrder,
			challengeCount: track._count.challenges
		}));
	}),

	getPublishedTrackBySlug: publicProcedure
		.input(exerciseTrackSlugSchema)
		.query(async ({ ctx, input }) => {
			const track = await ctx.db.exerciseTrack.findFirst({
				where: {
					slug: input.slug,
					isPublished: true,
					isArchived: false
				},
				select: {
					id: true,
					name: true,
					slug: true,
					description: true,
					repoUrl: true,
					sortOrder: true,
					challenges: {
						where: { isArchived: false },
						select: {
							id: true,
							title: true,
							slug: true,
							difficulty: true,
							sortOrder: true
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

			const isLoggedIn = Boolean(ctx.session.userId);
			const hasCloneableRepo = Boolean(track.repoUrl.trim());
			const sortedChallenges = sortChallengesByDifficultyThenOrder(
				track.challenges
			);

			let progressByChallengeId = new Map<
				string,
				UserChallengeProgressStatus
			>();

			if (ctx.session.userId && sortedChallenges.length > 0) {
				const progressRows = await ctx.db.userChallengeProgress.findMany({
					where: {
						userId: ctx.session.userId,
						challengeId: {
							in: sortedChallenges.map((challenge) => challenge.id)
						}
					},
					select: { challengeId: true, status: true }
				});

				progressByChallengeId = new Map(
					progressRows.map((row) => [row.challengeId, row.status])
				);
			}

			return {
				id: track.id,
				name: track.name,
				slug: track.slug,
				description: track.description,
				sortOrder: track.sortOrder,
				repoUrl: isLoggedIn && hasCloneableRepo ? track.repoUrl : null,
				isCloneable: isLoggedIn && hasCloneableRepo,
				challenges: sortedChallenges.map((challenge) => ({
					...challenge,
					status: isLoggedIn
						? resolveProgressStatus(progressByChallengeId.get(challenge.id))
						: null
				}))
			};
		}),

	getPublishedChallengeBySlug: publicProcedure
		.input(exerciseChallengeSlugSchema)
		.query(async ({ ctx, input }) => {
			const challenge = await ctx.db.exerciseChallenge.findFirst({
				where: {
					slug: input.challengeSlug,
					isArchived: false,
					track: {
						slug: input.trackSlug,
						isPublished: true,
						isArchived: false
					}
				},
				select: {
					id: true,
					title: true,
					slug: true,
					difficulty: true,
					sortOrder: true,
					description: true,
					setupInstructions: true,
					acceptanceCriteria: true,
					track: {
						select: {
							id: true,
							name: true,
							slug: true,
							repoUrl: true
						}
					}
				}
			});

			if (!challenge) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Challenge not found'
				});
			}

			const isLoggedIn = Boolean(ctx.session.userId);
			const hasCloneableRepo = Boolean(challenge.track.repoUrl.trim());

			let status: UserChallengeProgressStatus | null = null;
			let latestMentorFeedback: {
				status: 'APPROVED' | 'CHANGES_REQUESTED' | 'PENDING';
				mentorComment: string | null;
				prUrl: string;
				reviewedAt: Date | null;
			} | null = null;
			let updatableSubmission: {
				id: string;
				prUrl: string;
			} | null = null;

			if (ctx.session.userId) {
				const progress = await ctx.db.userChallengeProgress.findUnique({
					where: {
						userId_challengeId: {
							userId: ctx.session.userId,
							challengeId: challenge.id
						}
					},
					select: { status: true }
				});
				status = resolveProgressStatus(progress?.status);

				const latestDecision = await ctx.db.exerciseReviewDecision.findFirst({
					where: {
						challengeId: challenge.id,
						submission: { submittedById: ctx.session.userId },
						status: { in: ['APPROVED', 'CHANGES_REQUESTED'] }
					},
					orderBy: { reviewedAt: 'desc' },
					select: {
						status: true,
						mentorComment: true,
						reviewedAt: true,
						submission: { select: { id: true, prUrl: true } }
					}
				});

				if (latestDecision) {
					latestMentorFeedback = {
						status: latestDecision.status,
						mentorComment: latestDecision.mentorComment,
						prUrl: latestDecision.submission.prUrl,
						reviewedAt: latestDecision.reviewedAt
					};

					if (latestDecision.status === 'CHANGES_REQUESTED') {
						updatableSubmission = {
							id: latestDecision.submission.id,
							prUrl: latestDecision.submission.prUrl
						};
					}
				}
			}

			return {
				id: challenge.id,
				title: challenge.title,
				slug: challenge.slug,
				difficulty: challenge.difficulty,
				sortOrder: challenge.sortOrder,
				status,
				latestMentorFeedback,
				updatableSubmission,
				track: {
					id: challenge.track.id,
					name: challenge.track.name,
					slug: challenge.track.slug,
					repoUrl:
						isLoggedIn && hasCloneableRepo ? challenge.track.repoUrl : null,
					isCloneable: isLoggedIn && hasCloneableRepo
				},
				...(isLoggedIn
					? {
							description: challenge.description,
							setupInstructions: challenge.setupInstructions,
							acceptanceCriteria: challenge.acceptanceCriteria
						}
					: {
							description: null,
							setupInstructions: null,
							acceptanceCriteria: null
						})
			};
		}),

	adminListTracks: adminProcedure.query(async ({ ctx }) => {
		const tracks = await ctx.db.exerciseTrack.findMany({
			orderBy: [{ isArchived: 'asc' }, { sortOrder: 'asc' }],
			include: {
				_count: {
					select: {
						challenges: {
							where: { isArchived: false }
						}
					}
				}
			}
		});

		return tracks.map(({ _count, ...track }) => ({
			...track,
			challengeCount: _count.challenges
		}));
	}),

	adminGetTrack: adminProcedure
		.input(exerciseTrackIdSchema)
		.query(async ({ ctx, input }) => {
			const track = await ctx.db.exerciseTrack.findUnique({
				where: { id: input.id },
				include: {
					challenges: true
				}
			});

			if (!track) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Track not found'
				});
			}

			return {
				...track,
				challenges: sortChallengesByDifficultyThenOrder(track.challenges)
			};
		}),

	adminListReviewQueue: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.exerciseReviewSubmission.findMany({
			where: { needsAttention: true },
			orderBy: { createdAt: 'asc' },
			include: {
				track: {
					select: { id: true, name: true, slug: true }
				},
				submittedBy: {
					select: { id: true, name: true, email: true }
				},
				decisions: {
					include: {
						challenge: {
							select: { id: true, title: true, slug: true, difficulty: true }
						}
					},
					orderBy: { createdAt: 'asc' }
				}
			}
		});
	}),

	adminGetReviewSubmission: adminProcedure
		.input(exerciseReviewSubmissionIdSchema)
		.query(async ({ ctx, input }) => {
			const submission = await ctx.db.exerciseReviewSubmission.findUnique({
				where: { id: input.id },
				include: {
					track: {
						select: { id: true, name: true, slug: true }
					},
					submittedBy: {
						select: { id: true, name: true, email: true }
					},
					decisions: {
						include: {
							challenge: {
								select: {
									id: true,
									title: true,
									slug: true,
									difficulty: true,
									acceptanceCriteria: true
								}
							},
							reviewedBy: {
								select: { id: true, name: true, email: true }
							}
						},
						orderBy: { createdAt: 'asc' }
					}
				}
			});

			if (!submission) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Review submission not found'
				});
			}

			return submission;
		})
};
