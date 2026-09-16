import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { learningPlanRouter } from './learningPlan.router';

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

const createCaller = createCallerFactory(learningPlanRouter);

const learnerAuth = (userId: string) => ({
	userId,
	sessionClaims: null,
	sessionId: 'session-id',
	has: () => false
});

beforeEach(() => {
	mockAuth.mockReturnValue(learnerAuth('learner-1'));
});

describe('learningPlan access', () => {
	it('does not let a learner manage another learner plan', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.get({ learnerId: 'learner-2' })).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});
});

describe('learningPlan.getCandidates', () => {
	it('includes upcoming cohort events for an active member', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'INACTIVE'
		} as never);
		mockDb.task.findMany.mockResolvedValue([]);
		mockDb.exerciseChallenge.findMany.mockResolvedValue([]);
		mockDb.remediationAction.findMany.mockResolvedValue([]);
		mockDb.cohortEvent.findMany.mockResolvedValue([
			{
				id: 'event-1',
				title: 'Kickoff',
				startsAt: new Date('2026-09-01T18:00:00.000Z')
			}
		] as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getCandidates()).resolves.toMatchObject({
			cohortEvents: [
				{
					type: 'COHORT_EVENT',
					id: 'event-1',
					title: 'Kickoff',
					href: '/cohorts?eventId=event-1'
				}
			]
		});
		expect(mockDb.cohortEvent.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					status: 'PLANNED',
					cohort: expect.objectContaining({
						memberships: {
							some: { userId: 'learner-1', status: 'ACTIVE' }
						}
					})
				})
			})
		);
	});
});

describe('learningPlan.addItem', () => {
	it('adds a custom action after validating its plan dependencies', async () => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.learningPlan.findUnique.mockResolvedValue({
			id: 'plan-1',
			items: [{ id: 'item-1' }]
		} as never);
		mockDb.learningPlanItem.findFirst.mockResolvedValue({
			position: 0
		} as never);
		mockDb.learningPlanItem.create.mockResolvedValue({
			id: 'item-2',
			planId: 'plan-1',
			position: 1,
			title: 'Practice integration tests',
			status: 'PLANNED'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.addItem({
				reason: 'Turn the diagnosis gap into a small repeatable practice',
				targetType: 'CUSTOM',
				title: 'Practice integration tests',
				dependencyIds: ['item-1']
			})
		).resolves.toMatchObject({ id: 'item-2', position: 1 });

		expect(mockDb.learningPlanItem.create).toHaveBeenCalledWith({
			data: {
				planId: 'plan-1',
				position: 1,
				title: 'Practice integration tests',
				reason: 'Turn the diagnosis gap into a small repeatable practice',
				dueAt: null,
				targetType: 'CUSTOM',
				targetId: null,
				targetHref: null,
				dependencies: { create: [{ prerequisiteItemId: 'item-1' }] }
			}
		});
	});
});

describe('learningPlan.updateItem', () => {
	it('does not start an action while a prerequisite is incomplete', async () => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.learningPlanItem.findFirst.mockResolvedValue({
			id: 'item-2',
			planId: 'plan-1',
			status: 'PLANNED',
			dependencies: [{ prerequisiteItemId: 'item-1' }]
		} as never);
		mockDb.learningPlanItem.findMany
			.mockResolvedValueOnce([
				{
					id: 'item-1',
					dependencies: []
				},
				{
					id: 'item-2',
					dependencies: [{ prerequisiteItemId: 'item-1' }]
				}
			] as never)
			.mockResolvedValueOnce([{ status: 'PLANNED' }] as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.updateItem({ itemId: 'item-2', status: 'IN_PROGRESS' })
		).rejects.toMatchObject({ code: 'CONFLICT' });
		expect(mockDb.learningPlanItem.update).not.toHaveBeenCalled();
	});
});

describe('learningPlan.updateItem dependency graph', () => {
	it('rejects a dependency cycle', async () => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.learningPlanItem.findFirst.mockResolvedValue({
			id: 'item-2',
			planId: 'plan-1',
			status: 'PLANNED',
			dependencies: []
		} as never);
		mockDb.learningPlanItem.findMany.mockResolvedValue([
			{
				id: 'item-1',
				dependencies: [{ prerequisiteItemId: 'item-2' }]
			},
			{ id: 'item-2', dependencies: [] }
		] as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.updateItem({ itemId: 'item-2', dependencyIds: ['item-1'] })
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.learningPlanItem.update).not.toHaveBeenCalled();
	});
});

describe('learningPlan.save', () => {
	it('lets a learner create or update their current plan', async () => {
		mockDb.learningPlan.upsert.mockResolvedValue({
			id: 'plan-1',
			learnerId: 'learner-1',
			title: 'Testing foundations',
			objective: 'Build confidence with integration tests'
		} as never);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.save({
				title: 'Testing foundations',
				objective: 'Build confidence with integration tests'
			})
		).resolves.toMatchObject({ id: 'plan-1', learnerId: 'learner-1' });

		expect(mockDb.learningPlan.upsert).toHaveBeenCalledWith({
			where: { learnerId: 'learner-1' },
			create: {
				learnerId: 'learner-1',
				createdById: 'learner-1',
				title: 'Testing foundations',
				objective: 'Build confidence with integration tests'
			},
			update: {
				title: 'Testing foundations',
				objective: 'Build confidence with integration tests'
			}
		});
	});
});
