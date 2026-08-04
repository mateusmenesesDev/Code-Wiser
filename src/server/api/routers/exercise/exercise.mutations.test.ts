import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { exerciseRouter } from './exercise.router';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'admin-user-id',
		sessionClaims: { o: { rol: 'admin' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: ({ role }: { role: string }) => role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('exercise admin mutations', () => {
	const createCaller = createCallerFactory(exerciseRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		caller = createCaller(
			await createTRPCContext({
				headers: new Headers()
			})
		);
	});

	it('creates a track with slugified name', async () => {
		mockDb.exerciseTrack.findUnique.mockResolvedValue(null);
		mockDb.exerciseTrack.create.mockResolvedValue({
			id: '11111111-1111-1111-1111-111111111111',
			name: 'Lógica de Programação',
			slug: 'logica-de-programacao',
			description: 'Algorithms track',
			repoUrl: 'https://github.com/org/logic',
			isPublished: false,
			isArchived: false,
			sortOrder: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		} as never);

		const result = await caller.createTrack({
			name: 'Lógica de Programação',
			description: 'Algorithms track',
			repoUrl: 'https://github.com/org/logic'
		});

		expect(mockDb.exerciseTrack.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				name: 'Lógica de Programação',
				slug: 'logica-de-programacao',
				repoUrl: 'https://github.com/org/logic',
				isPublished: false
			})
		});
		expect(result.slug).toBe('logica-de-programacao');
	});

	it('archives a track and unpublishes it', async () => {
		mockDb.exerciseTrack.findUnique.mockResolvedValue({
			id: '11111111-1111-1111-1111-111111111111',
			isArchived: false,
			isPublished: true
		} as never);
		mockDb.exerciseTrack.update.mockResolvedValue({
			id: '11111111-1111-1111-1111-111111111111',
			isArchived: true,
			isPublished: false
		} as never);

		const result = await caller.archiveTrack({
			id: '11111111-1111-1111-1111-111111111111'
		});

		expect(mockDb.exerciseTrack.update).toHaveBeenCalledWith({
			where: { id: '11111111-1111-1111-1111-111111111111' },
			data: { isArchived: true, isPublished: false }
		});
		expect(result.isArchived).toBe(true);
		expect(result.isPublished).toBe(false);
	});

	it('creates a challenge on a track', async () => {
		mockDb.exerciseTrack.findUnique.mockResolvedValue({
			id: '11111111-1111-1111-1111-111111111111',
			isArchived: false
		} as never);
		mockDb.exerciseChallenge.findUnique.mockResolvedValue(null);
		mockDb.exerciseChallenge.create.mockResolvedValue({
			id: '22222222-2222-2222-2222-222222222222',
			trackId: '11111111-1111-1111-1111-111111111111',
			title: 'Counter App',
			slug: 'counter-app',
			difficulty: 'EASY',
			description: 'Build a counter',
			setupInstructions: 'npm i',
			acceptanceCriteria: 'Tests pass',
			isArchived: false,
			sortOrder: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		} as never);

		const result = await caller.createChallenge({
			trackId: '11111111-1111-1111-1111-111111111111',
			title: 'Counter App',
			difficulty: 'EASY',
			description: 'Build a counter',
			setupInstructions: 'npm i',
			acceptanceCriteria: 'Tests pass'
		});

		expect(result.slug).toBe('counter-app');
		expect(mockDb.exerciseChallenge.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				title: 'Counter App',
				slug: 'counter-app',
				difficulty: 'EASY'
			})
		});
	});

	it('reorders challenges within a difficulty', async () => {
		mockDb.exerciseChallenge.findMany.mockResolvedValue([
			{ id: '22222222-2222-2222-2222-222222222222' },
			{ id: '33333333-3333-3333-3333-333333333333' }
		] as never);
		mockDb.$transaction.mockResolvedValue([] as never);
		mockDb.exerciseChallenge.update.mockResolvedValue({} as never);

		const result = await caller.reorderChallenges({
			trackId: '11111111-1111-1111-1111-111111111111',
			difficulty: 'EASY',
			orderedChallengeIds: [
				'33333333-3333-3333-3333-333333333333',
				'22222222-2222-2222-2222-222222222222'
			]
		});

		expect(result).toEqual({ success: true });
		expect(mockDb.$transaction).toHaveBeenCalled();
	});
});
