import { TRPCError } from '@trpc/server';
import {
	exerciseChallengeSlugSchema,
	exerciseTrackIdSchema,
	exerciseTrackSlugSchema
} from '~/features/exercises/schemas/exercise.schema';
import { adminProcedure, publicProcedure } from '../../trpc';

const DIFFICULTY_ORDER = {
	EASY: 0,
	MEDIUM: 1,
	HARD: 2
} as const;

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

			return {
				id: track.id,
				name: track.name,
				slug: track.slug,
				description: track.description,
				sortOrder: track.sortOrder,
				repoUrl: isLoggedIn && hasCloneableRepo ? track.repoUrl : null,
				isCloneable: isLoggedIn && hasCloneableRepo,
				challenges: sortChallengesByDifficultyThenOrder(track.challenges)
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

			return {
				id: challenge.id,
				title: challenge.title,
				slug: challenge.slug,
				difficulty: challenge.difficulty,
				sortOrder: challenge.sortOrder,
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
		})
};
