import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectRouter } from '../project';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'admin-user-id',
		sessionClaims: { o: { rol: 'admin' } },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: ({ role }: { role: string }) => role === 'org:admin'
	}),
	clerkClient: {
		users: {
			getOrganizationMembershipList: vi.fn()
		}
	}
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('project.removeProjectMember', () => {
	const createCaller = createCallerFactory(projectRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('removes a member, unassigns tasks, records audit, refunds from evidence, and notifies', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.project.findUnique.mockResolvedValue({
			id: 'project-id',
			title: 'Project Alpha',
			members: [
				{ id: 'removed-user-id', email: 'user@example.com', name: 'User' },
				{ id: 'other-user-id', email: 'other@example.com', name: 'Other' }
			]
		} as never);
		mockDb.projectCreditPaymentEvidence.findFirst.mockResolvedValue({
			id: 'payment-evidence-id',
			credits: 10
		} as never);
		mockDb.task.updateMany.mockResolvedValue({ count: 2 } as never);
		mockDb.project.update.mockResolvedValue({} as never);
		mockDb.user.update.mockResolvedValue({} as never);
		mockDb.projectMemberRemovalAudit.create.mockResolvedValue({
			id: 'audit-id'
		} as never);
		mockDb.notification.create.mockResolvedValue({} as never);

		const result = await caller.removeProjectMember({
			projectId: 'project-id',
			userId: 'removed-user-id',
			refundCredits: true,
			reason: 'No longer participating'
		});

		expect(result.refundedCredits).toBe(10);
		expect(result.tasksUnassigned).toBe(2);
		expect(mockDb.task.updateMany).toHaveBeenCalledWith({
			where: { projectId: 'project-id', assigneeId: 'removed-user-id' },
			data: { assigneeId: null }
		});
		expect(mockDb.project.update).toHaveBeenCalledWith({
			where: { id: 'project-id' },
			data: { members: { disconnect: { id: 'removed-user-id' } } }
		});
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'removed-user-id' },
			data: { credits: { increment: 10 } }
		});
		expect(mockDb.projectMemberRemovalAudit.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					projectId: 'project-id',
					userId: 'removed-user-id',
					removedById: 'admin-user-id',
					reason: 'No longer participating',
					tasksUnassigned: 2,
					refundStatus: 'REFUNDED',
					refundedCredits: 10,
					paymentEvidenceId: 'payment-evidence-id'
				})
			})
		);
		expect(mockDb.notification.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'removed-user-id',
				type: 'PROJECT_MEMBER_REMOVED',
				message: expect.stringContaining('10 credits were refunded')
			})
		});
	});

	it('rejects requested refunds without payment evidence', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.project.findUnique.mockResolvedValue({
			id: 'project-id',
			title: 'Project Alpha',
			members: [
				{ id: 'removed-user-id', email: 'user@example.com', name: null }
			]
		} as never);
		mockDb.projectCreditPaymentEvidence.findFirst.mockResolvedValue(null);
		mockDb.projectInvitation.findFirst.mockResolvedValue(null);

		await expect(
			caller.removeProjectMember({
				projectId: 'project-id',
				userId: 'removed-user-id',
				refundCredits: true
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.project.update).not.toHaveBeenCalled();
		expect(mockDb.user.update).not.toHaveBeenCalled();
	});
});
