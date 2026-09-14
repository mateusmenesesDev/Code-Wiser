import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { remediationRouter } from './remediationRouter';

const authState = vi.hoisted(() => ({
	userId: 'learner-1' as string | null,
	isAdmin: false
}));

const notifyRemediationActionSubmitted = vi.hoisted(() => vi.fn());
const notifyRemediationActionCompleted = vi.hoisted(() => vi.fn());

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: authState.isAdmin ? { o: { rol: 'admin' } } : null,
		sessionId: authState.userId ? 'session-1' : null,
		getToken: () => Promise.resolve(authState.userId ? 'token' : null),
		has: ({ role }: { role: string }) =>
			authState.isAdmin && role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/services/notification/notificationService', () => ({
	notifyRemediationActionSubmitted,
	notifyRemediationActionCompleted
}));

describe('remediation actions', () => {
	const createCaller = createCallerFactory(remediationRouter);

	beforeEach(() => {
		authState.userId = 'learner-1';
		authState.isAdmin = false;
		mockDb.remediationAction.updateMany.mockResolvedValue({ count: 1 });
		mockDb.remediationAction.findFirst.mockResolvedValue({
			id: 'action-1',
			learner: { name: 'Learner' },
			title: 'Address feedback',
			targetType: 'TASK',
			task: { id: 'task-1', projectId: 'project-1' },
			challenge: null,
			bookingId: null,
			status: 'IN_PROGRESS'
		} as never);
		mockDb.remediationAction.findUnique.mockResolvedValue({
			id: 'action-1',
			learnerId: 'learner-1',
			title: 'Address feedback',
			status: 'SUBMITTED',
			targetType: 'TASK',
			task: { id: 'task-1', projectId: 'project-1' },
			challenge: null,
			bookingId: null
		} as never);
		vi.clearAllMocks();
		notifyRemediationActionSubmitted.mockResolvedValue(undefined);
		notifyRemediationActionCompleted.mockResolvedValue(undefined);
	});

	it('moves an owned action to submitted with evidence', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.submit({
			actionId: 'action-1',
			evidenceNote: 'Added integration coverage and ran the test suite.'
		});

		expect(mockDb.remediationAction.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					id: 'action-1',
					learnerId: 'learner-1'
				}),
				data: expect.objectContaining({
					status: 'SUBMITTED',
					evidenceNote: 'Added integration coverage and ran the test suite.'
				})
			})
		);
		expect(notifyRemediationActionSubmitted).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Address feedback' })
		);
	});

	it('lets an admin close submitted work and notifies the learner', async () => {
		authState.userId = 'admin-1';
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.review({ actionId: 'action-1', status: 'COMPLETED' });

		expect(mockDb.remediationAction.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'action-1', status: { not: 'CANCELLED' } },
				data: expect.objectContaining({
					status: 'COMPLETED',
					completedById: 'admin-1'
				})
			})
		);
		expect(notifyRemediationActionCompleted).toHaveBeenCalledWith(
			expect.objectContaining({ learnerId: 'learner-1' })
		);
	});
});
