import {
	RetrospectiveReactionType,
	RetrospectiveTimerStatus
} from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { retrospectiveRouter } from './retrospective.router';

const realtime = vi.hoisted(() => ({
	trigger: vi.fn()
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => realtime
}));

const caller = async () =>
	createCallerFactory(retrospectiveRouter)(
		await createTRPCContext({ headers: new Headers() })
	);

const managerMembership = {
	memberships: [
		{
			userId: 'user-1',
			role: 'MENTOR',
			status: 'ACTIVE',
			joinedAt: new Date()
		}
	],
	canceledAt: null
};

beforeEach(() => {
	mockDb.project.findUnique.mockResolvedValue(managerMembership as never);
	realtime.trigger.mockResolvedValue(undefined);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('retrospective router', () => {
	it('starts a retrospective only for a completed sprint', async () => {
		mockDb.sprint.findFirst.mockResolvedValue({
			id: 'sprint-1',
			status: 'COMPLETED'
		} as never);
		mockDb.retrospective.create.mockResolvedValue({
			id: 'retro-1',
			sprintId: 'sprint-1'
		} as never);

		const result = await (await caller()).create({
			projectId: 'project-1',
			sprintId: 'sprint-1'
		});

		expect(result).toMatchObject({ id: 'retro-1' });
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-retrospective-project-project-1',
			'retrospective-created',
			expect.objectContaining({ retrospectiveId: 'retro-1' })
		);
		expect(mockDb.retrospective.create).toHaveBeenCalledWith({
			data: {
				projectId: 'project-1',
				sprintId: 'sprint-1',
				createdById: 'user-1'
			},
			include: expect.any(Object)
		});
	});

	it('requires sprint management permission to start a retrospective', async () => {
		mockDb.project.findUnique.mockResolvedValue({
			memberships: [
				{
					userId: 'user-1',
					role: 'LEARNER',
					status: 'ACTIVE',
					joinedAt: new Date()
				}
			],
			canceledAt: null
		} as never);

		await expect(
			(await caller()).create({ projectId: 'project-1', sprintId: 'sprint-1' })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
		expect(mockDb.sprint.findFirst).not.toHaveBeenCalled();
	});

	it('rejects a retrospective for an unfinished sprint', async () => {
		mockDb.sprint.findFirst.mockResolvedValue({
			id: 'sprint-1',
			status: 'ACTIVE'
		} as never);

		await expect(
			(await caller()).create({ projectId: 'project-1', sprintId: 'sprint-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'Retrospectives can only be started for completed sprints'
		});
		expect(mockDb.retrospective.create).not.toHaveBeenCalled();
	});

	it('lets project members react to notes and toggle their reaction', async () => {
		mockDb.retrospectiveItem.findUnique.mockResolvedValue({
			id: 'item-1',
			authorId: 'user-2',
			category: 'IMPROVE',
			retrospective: { id: 'retro-1', projectId: 'project-1' }
		} as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.retrospectiveItemReaction.findUnique
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: 'reaction-1',
				itemId: 'item-1',
				userId: 'user-1',
				type: RetrospectiveReactionType.LIKE
			} as never)
			.mockResolvedValueOnce({
				id: 'reaction-1',
				itemId: 'item-1',
				userId: 'user-1',
				type: RetrospectiveReactionType.DISLIKE
			} as never);
		mockDb.retrospectiveItemReaction.upsert.mockResolvedValue({
			id: 'reaction-1',
			type: RetrospectiveReactionType.LIKE
		} as never);
		mockDb.retrospectiveItemReaction.update.mockResolvedValue({
			id: 'reaction-1',
			type: RetrospectiveReactionType.DISLIKE
		} as never);

		const api = await caller();
		await api.toggleReaction({
			itemId: 'item-1',
			reaction: RetrospectiveReactionType.LIKE
		});
		await api.toggleReaction({
			itemId: 'item-1',
			reaction: RetrospectiveReactionType.DISLIKE
		});
		await api.toggleReaction({
			itemId: 'item-1',
			reaction: RetrospectiveReactionType.DISLIKE
		});

		expect(mockDb.retrospectiveItemReaction.upsert).toHaveBeenCalledWith({
			where: { itemId_userId: { itemId: 'item-1', userId: 'user-1' } },
			create: {
				itemId: 'item-1',
				userId: 'user-1',
				type: RetrospectiveReactionType.LIKE
			},
			update: { type: RetrospectiveReactionType.LIKE }
		});
		expect(mockDb.retrospectiveItemReaction.update).toHaveBeenCalledWith({
			where: { id: 'reaction-1' },
			data: { type: RetrospectiveReactionType.DISLIKE }
		});
		expect(mockDb.retrospectiveItemReaction.delete).toHaveBeenCalledWith({
			where: { id: 'reaction-1' }
		});
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-retrospective-project-project-1',
			'retrospective-item-reacted',
			expect.objectContaining({
				itemId: 'item-1',
				reaction: null,
				userId: 'user-1'
			})
		);
	});

	it('starts, pauses, and resets the shared retrospective timer', async () => {
		vi.useFakeTimers();
		const startedAt = new Date('2026-09-25T10:00:00.000Z');
		vi.setSystemTime(startedAt);
		mockDb.retrospective.findUnique
			.mockResolvedValueOnce({ id: 'retro-1', projectId: 'project-1' } as never)
			.mockResolvedValueOnce({
				timerStatus: RetrospectiveTimerStatus.IDLE,
				timerDurationSeconds: 300,
				timerRemainingSeconds: 300,
				timerStartedAt: null,
				timerPausedAt: null
			} as never)
			.mockResolvedValueOnce({ id: 'retro-1', projectId: 'project-1' } as never)
			.mockResolvedValueOnce({
				timerStatus: RetrospectiveTimerStatus.RUNNING,
				timerDurationSeconds: 300,
				timerRemainingSeconds: 300,
				timerStartedAt: startedAt,
				timerPausedAt: null
			} as never)
			.mockResolvedValueOnce({ id: 'retro-1', projectId: 'project-1' } as never)
			.mockResolvedValueOnce({
				timerStatus: RetrospectiveTimerStatus.PAUSED,
				timerDurationSeconds: 300,
				timerRemainingSeconds: 210,
				timerStartedAt: null,
				timerPausedAt: new Date('2026-09-25T10:01:30.000Z')
			} as never);
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.retrospective.update.mockResolvedValue({ id: 'retro-1' } as never);

		const api = await caller();
		await api.setTimer({ retrospectiveId: 'retro-1', action: 'START' });
		vi.advanceTimersByTime(90_000);
		await api.setTimer({ retrospectiveId: 'retro-1', action: 'PAUSE' });
		await api.setTimer({ retrospectiveId: 'retro-1', action: 'RESET' });

		expect(mockDb.retrospective.update).toHaveBeenNthCalledWith(1, {
			where: { id: 'retro-1' },
			data: {
				timerStatus: RetrospectiveTimerStatus.RUNNING,
				timerStartedAt: startedAt,
				timerPausedAt: null
			}
		});
		expect(mockDb.retrospective.update).toHaveBeenNthCalledWith(2, {
			where: { id: 'retro-1' },
			data: {
				timerStatus: RetrospectiveTimerStatus.PAUSED,
				timerRemainingSeconds: 210,
				timerStartedAt: null,
				timerPausedAt: new Date('2026-09-25T10:01:30.000Z')
			}
		});
		expect(mockDb.retrospective.update).toHaveBeenNthCalledWith(3, {
			where: { id: 'retro-1' },
			data: {
				timerStatus: RetrospectiveTimerStatus.IDLE,
				timerRemainingSeconds: 300,
				timerStartedAt: null,
				timerPausedAt: null
			}
		});
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-retrospective-project-project-1',
			'retrospective-timer-updated',
			expect.objectContaining({ retrospectiveId: 'retro-1' })
		);
	});

	it('lets project members add notes and complete action items', async () => {
		mockDb.retrospective.findUnique.mockResolvedValue({
			id: 'retro-1',
			projectId: 'project-1'
		} as never);
		mockDb.retrospectiveItem.count.mockResolvedValue(1);
		mockDb.retrospectiveItem.create.mockResolvedValue({
			id: 'item-1',
			category: 'ACTION',
			content: 'Pair on task breakdown',
			authorId: 'user-1'
		} as never);
		mockDb.retrospectiveItem.findUnique.mockResolvedValue({
			id: 'item-1',
			authorId: 'user-1',
			category: 'ACTION',
			retrospective: { id: 'retro-1', projectId: 'project-1' }
		} as never);
		mockDb.retrospectiveItem.update.mockResolvedValue({
			id: 'item-1'
		} as never);

		const api = await caller();
		await api.addItem({
			retrospectiveId: 'retro-1',
			category: 'ACTION',
			content: 'Pair on task breakdown'
		});
		await api.toggleItem({ itemId: 'item-1', completed: true });

		expect(mockDb.retrospectiveItem.create).toHaveBeenCalledWith({
			data: {
				retrospectiveId: 'retro-1',
				category: 'ACTION',
				content: 'Pair on task breakdown',
				order: 1,
				authorId: 'user-1'
			},
			include: expect.any(Object)
		});
		expect(realtime.trigger).toHaveBeenCalledWith(
			'presence-retrospective-project-project-1',
			'retrospective-item-toggled',
			expect.objectContaining({ itemId: 'item-1', completed: true })
		);
		expect(mockDb.retrospectiveItem.update).toHaveBeenCalledWith({
			where: { id: 'item-1' },
			data: { completed: true }
		});
	});
});
