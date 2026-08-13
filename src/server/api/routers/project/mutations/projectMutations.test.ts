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

beforeEach(() => {
	mockDb.creditTransaction.createMany.mockResolvedValue({ count: 1 });
	mockDb.creditTransaction.findUnique.mockResolvedValue({
		id: 'credit-transaction-id'
	} as never);
	mockDb.user.updateMany.mockResolvedValue({ count: 1 });
});

describe('project.createProject', () => {
	const createCaller = createCallerFactory(projectRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('copies template tasks in one bulk insert to keep creation transaction short', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.user.findUnique.mockResolvedValue({
			id: 'admin-user-id',
			credits: 0,
			mentorshipStatus: 'ACTIVE'
		} as never);
		mockDb.projectTemplate.findUnique.mockResolvedValue({
			id: 'template-id',
			title: 'Project Alpha',
			description: 'Template description',
			methodology: 'SCRUM',
			minParticipants: 1,
			maxParticipants: 4,
			accessType: 'FREE',
			difficulty: 'BEGINNER',
			credits: 0,
			figmaProjectUrl: null,
			publicCode: 'PROJECTALPHA',
			nextTaskNumber: 3,
			categoryId: null,
			milestones: [
				{
					id: 'template-milestone-id',
					title: 'Milestone 1',
					description: 'First delivery',
					order: 0
				}
			],
			learningOutcomes: [{ id: 'outcome-1', value: 'Ship a working feature' }],
			sprints: [
				{
					id: 'template-sprint-id',
					title: 'Sprint 1',
					milestoneId: 'template-milestone-id'
				}
			],
			epics: [
				{
					id: 'template-epic-id',
					title: 'Epic 1',
					milestoneId: 'template-milestone-id'
				}
			],
			tasks: [
				{
					id: 'template-task-1',
					title: 'Task 1',
					epicId: 'template-epic-id',
					sprintId: 'template-sprint-id',
					projectTemplateId: 'template-id',
					milestoneId: 'template-milestone-id',
					publicNumber: 1
				},
				{
					id: 'template-task-2',
					title: 'Task 2',
					epicId: null,
					sprintId: null,
					projectTemplateId: 'template-id',
					publicNumber: 2
				}
			]
		} as never);
		mockDb.project.findFirst.mockResolvedValue(null);
		mockDb.project.findUnique.mockResolvedValue(null);
		mockDb.project.create.mockResolvedValue({ id: 'project-id' } as never);
		mockDb.milestone.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.learningOutcome.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.sprint.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.epic.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.task.createMany.mockResolvedValue({ count: 2 } as never);
		mockDb.user.update.mockResolvedValue({} as never);

		const result = await caller.createProject({
			projectTemplateId: 'template-id',
			idempotencyKey: '33333333-3333-4333-8333-333333333333'
		});

		expect(result).toBe('project-id');
		expect(mockDb.project.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				publicCode: 'PROJECTALPHA',
				nextTaskNumber: 3
			})
		});
		expect(mockDb.sprint.create).not.toHaveBeenCalled();
		expect(mockDb.epic.create).not.toHaveBeenCalled();
		expect(mockDb.task.create).not.toHaveBeenCalled();
		expect(mockDb.milestone.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					id: expect.any(String),
					title: 'Milestone 1',
					projectId: 'project-id',
					projectTemplateId: null
				})
			]
		});
		expect(mockDb.learningOutcome.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					value: 'Ship a working feature',
					projectId: 'project-id',
					projectTemplateId: null
				})
			]
		});
		expect(mockDb.sprint.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					id: expect.any(String),
					title: 'Sprint 1',
					projectId: 'project-id',
					projectTemplateId: null,
					milestoneId: expect.any(String)
				})
			]
		});
		expect(mockDb.epic.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					id: expect.any(String),
					title: 'Epic 1',
					projectId: 'project-id',
					projectTemplateId: null,
					milestoneId: expect.any(String)
				})
			]
		});

		const sprintCreateData = (
			mockDb.sprint.createMany.mock.calls[0]?.[0] as {
				data: Array<{ id: string }>;
			}
		).data;
		const epicCreateData = (
			mockDb.epic.createMany.mock.calls[0]?.[0] as {
				data: Array<{ id: string }>;
			}
		).data;
		const sprintId = sprintCreateData[0]?.id;
		const epicId = epicCreateData[0]?.id;

		expect(mockDb.task.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					title: 'Task 1',
					publicNumber: 1,
					projectId: 'project-id',
					epicId,
					sprintId,
					milestoneId: expect.any(String),
					projectTemplateId: null
				}),
				expect.objectContaining({
					title: 'Task 2',
					publicNumber: 2,
					projectId: 'project-id',
					epicId: null,
					sprintId: null,
					projectTemplateId: null
				})
			]
		});
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'admin-user-id' },
			data: {
				tasks: {
					connect: expect.arrayContaining([
						expect.objectContaining({ id: expect.any(String) }),
						expect.objectContaining({ id: expect.any(String) })
					])
				}
			}
		});
		expect(mockDb.$transaction).toHaveBeenCalledWith(expect.any(Function), {
			timeout: 20_000
		});
	});

	it('rolls back a paid project when the ledger rejects an insufficient balance', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.user.findUnique.mockResolvedValue({
			id: 'admin-user-id',
			credits: 5,
			mentorshipStatus: 'INACTIVE'
		} as never);
		mockDb.projectTemplate.findUnique.mockResolvedValue({
			id: 'template-id',
			title: 'Paid project',
			description: 'Template description',
			methodology: 'SCRUM',
			minParticipants: 1,
			maxParticipants: 4,
			accessType: 'CREDITS',
			difficulty: 'BEGINNER',
			credits: 10,
			figmaProjectUrl: null,
			publicCode: 'PAIDPROJECT',
			nextTaskNumber: 1,
			categoryId: null,
			sprints: [],
			epics: [],
			tasks: []
		} as never);
		mockDb.project.findUnique.mockResolvedValue(null);
		mockDb.project.findFirst.mockResolvedValue(null);
		mockDb.project.create.mockResolvedValue({ id: 'project-id' } as never);
		mockDb.creditTransaction.createMany.mockResolvedValue({ count: 1 });
		mockDb.user.updateMany.mockResolvedValue({ count: 0 });

		await expect(
			caller.createProject({
				projectTemplateId: 'template-id',
				idempotencyKey: '22222222-2222-4222-8222-222222222222'
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.projectCreditPaymentEvidence.create).not.toHaveBeenCalled();
	});
});

describe('project.cancelProject', () => {
	const createCaller = createCallerFactory(projectRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('soft-cancels once, cancels pending invitations, refunds current member credit evidence, and notifies', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.project.findUnique.mockResolvedValue({
			id: 'project-id',
			title: 'Project Alpha',
			canceledAt: null,
			members: [{ id: 'member-1' }, { id: 'member-2' }],
			invitations: [{ id: 'invite-1', userId: 'invitee-1' }]
		} as never);
		mockDb.projectCreditPaymentEvidence.findMany.mockResolvedValue([
			{ id: 'evidence-1', userId: 'member-1', credits: 10 },
			{ id: 'evidence-2', userId: 'member-2', credits: 5 }
		] as never);
		mockDb.projectInvitation.findMany.mockResolvedValue([]);
		mockDb.user.update.mockResolvedValue({} as never);
		mockDb.projectInvitation.updateMany.mockResolvedValue({
			count: 1
		} as never);
		mockDb.project.update.mockResolvedValue({} as never);
		mockDb.notification.create.mockResolvedValue({} as never);

		const result = await caller.cancelProject({
			projectId: 'project-id',
			refundCredits: true,
			reason: 'Course ended'
		});

		expect(result).toMatchObject({
			success: true,
			refundedCredits: 15,
			membersNotified: 2,
			invitationsCanceled: 1
		});
		expect(mockDb.projectInvitation.updateMany).toHaveBeenCalledWith({
			where: { projectId: 'project-id', status: 'PENDING' },
			data: { status: 'CANCELED', canceledAt: expect.any(Date) }
		});
		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledTimes(2);
		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'member-1',
				value: 10,
				type: 'REFUND',
				source: 'PROJECT_CANCELLATION'
			}),
			skipDuplicates: true
		});
		expect(mockDb.project.update).toHaveBeenCalledWith({
			where: { id: 'project-id' },
			data: expect.objectContaining({
				canceledAt: expect.any(Date),
				canceledById: 'admin-user-id',
				cancellationReason: 'Course ended',
				refundCreditsOnCancellation: true,
				refundedCreditsOnCancellation: 15
			})
		});
		expect(mockDb.notification.create).toHaveBeenCalledTimes(3);
	});

	it('rejects canceling an already canceled project', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.project.findUnique.mockResolvedValue({
			id: 'project-id',
			title: 'Project Alpha',
			canceledAt: new Date(),
			members: [],
			invitations: []
		} as never);

		await expect(
			caller.cancelProject({
				projectId: 'project-id',
				refundCredits: true,
				reason: 'Already handled elsewhere'
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.project.update).not.toHaveBeenCalled();
		expect(mockDb.user.update).not.toHaveBeenCalled();
	});
});

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
		mockDb.task.findMany.mockResolvedValue([
			{ id: 'task-1' },
			{ id: 'task-2' }
		] as never);
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
		expect(mockDb.task.findMany).toHaveBeenCalledWith({
			where: {
				projectId: 'project-id',
				assignees: { some: { id: 'removed-user-id' } }
			},
			select: { id: true }
		});
		expect(mockDb.project.update).toHaveBeenCalledWith({
			where: { id: 'project-id' },
			data: { members: { disconnect: { id: 'removed-user-id' } } }
		});
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'removed-user-id' },
			data: {
				tasks: {
					disconnect: [{ id: 'task-1' }, { id: 'task-2' }]
				}
			}
		});
		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'removed-user-id',
				value: 10,
				type: 'REFUND',
				source: 'PROJECT_MEMBER_REMOVAL'
			}),
			skipDuplicates: true
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
