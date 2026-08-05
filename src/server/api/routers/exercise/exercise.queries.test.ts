import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { exerciseRouter } from './exercise.router';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: null,
		sessionClaims: null,
		sessionId: null,
		getToken: () => Promise.resolve(null),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('exercise public queries', () => {
	const createCaller = createCallerFactory(exerciseRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);
	});

	it('lists only published, non-archived tracks ordered by sortOrder', async () => {
		const tracks = [
			{
				id: 'track-1',
				name: 'React',
				slug: 'react',
				description: 'React track',
				repoUrl: 'https://github.com/org/react-exercises',
				isPublished: true,
				isArchived: false,
				sortOrder: 0,
				_count: { challenges: 2 }
			}
		];
		mockDb.exerciseTrack.findMany.mockResolvedValue(tracks as never);

		const result = await caller.listPublishedTracks();

		expect(mockDb.exerciseTrack.findMany).toHaveBeenCalledWith({
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
		expect(result).toEqual([
			{
				id: 'track-1',
				name: 'React',
				slug: 'react',
				description: 'React track',
				sortOrder: 0,
				challengeCount: 2
			}
		]);
	});

	it('returns track challenges sorted by difficulty then sortOrder and hides repo for anonymous users', async () => {
		mockDb.exerciseTrack.findFirst.mockResolvedValue({
			id: 'track-1',
			name: 'React',
			slug: 'react',
			description: 'React track',
			repoUrl: 'https://github.com/org/react-exercises',
			sortOrder: 0,
			isPublished: true,
			isArchived: false,
			challenges: [
				{
					id: 'c-hard',
					title: 'Hard one',
					slug: 'hard-one',
					difficulty: 'HARD',
					sortOrder: 0,
					isArchived: false
				},
				{
					id: 'c-easy-2',
					title: 'Easy two',
					slug: 'easy-two',
					difficulty: 'EASY',
					sortOrder: 1,
					isArchived: false
				},
				{
					id: 'c-easy-1',
					title: 'Easy one',
					slug: 'easy-one',
					difficulty: 'EASY',
					sortOrder: 0,
					isArchived: false
				},
				{
					id: 'c-medium',
					title: 'Medium one',
					slug: 'medium-one',
					difficulty: 'MEDIUM',
					sortOrder: 0,
					isArchived: false
				}
			]
		} as never);

		const result = await caller.getPublishedTrackBySlug({ slug: 'react' });

		expect(result.repoUrl).toBeNull();
		expect(result.isCloneable).toBe(false);
		expect(result.challenges.map((c) => c.slug)).toEqual([
			'easy-one',
			'easy-two',
			'medium-one',
			'hard-one'
		]);
	});

	it('hides challenge brief fields for anonymous users', async () => {
		mockDb.exerciseChallenge.findFirst.mockResolvedValue({
			id: 'c-1',
			title: 'Counter',
			slug: 'counter',
			difficulty: 'EASY',
			sortOrder: 0,
			isArchived: false,
			description: 'Build a counter',
			setupInstructions: 'npm install',
			acceptanceCriteria: 'Tests pass',
			track: {
				id: 'track-1',
				name: 'React',
				slug: 'react',
				repoUrl: 'https://github.com/org/react-exercises',
				isPublished: true,
				isArchived: false
			}
		} as never);

		const result = await caller.getPublishedChallengeBySlug({
			trackSlug: 'react',
			challengeSlug: 'counter'
		});

		expect(result.description).toBeNull();
		expect(result.setupInstructions).toBeNull();
		expect(result.acceptanceCriteria).toBeNull();
		expect(result.title).toBe('Counter');
	});
});
