import { SprintStatusEnum } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { sprintRouter } from '../sprint.router';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	}),
	clerkClient: {
		users: { getUser: vi.fn() }
	}
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

const caller = async () =>
	createCallerFactory(sprintRouter)(
		await createTRPCContext({ headers: new Headers() })
	);

const projectSprint = (status: SprintStatusEnum) => ({
	id: 'sprint-1',
	status,
	projectId: 'project-1',
	projectTemplateId: null,
	project: {
		memberships: [
			{
				userId: 'user-1',
				role: 'MENTOR',
				status: 'ACTIVE',
				joinedAt: new Date()
			}
		]
	}
});

describe('sprint mutations', () => {
	beforeEach(() => {
		mockDb.project.findUnique.mockResolvedValue({
			memberships: [
				{
					userId: 'user-1',
					role: 'MENTOR',
					status: 'ACTIVE',
					joinedAt: new Date()
				}
			],
			canceledAt: null
		} as never);
	});

	it('creates a sprint in an active project for a sprint manager', async () => {
		mockDb.sprint.count.mockResolvedValue(2);
		mockDb.sprint.create.mockResolvedValue({
			id: 'sprint-2',
			projectId: 'project-1',
			projectTemplateId: null
		} as never);

		const sprint = await (await caller()).create({
			title: '  Sprint 3  ',
			description: 'Ship the next slice',
			startDate: '2026-08-20',
			endDate: '2026-09-02',
			projectId: 'project-1',
			isTemplate: false
		});

		expect(sprint).toMatchObject({ id: 'sprint-2' });
		expect(mockDb.sprint.count).toHaveBeenCalledWith({
			where: { projectId: 'project-1' }
		});
		expect(mockDb.sprint.create).toHaveBeenCalledWith({
			data: {
				title: 'Sprint 3',
				description: 'Ship the next slice',
				startDate: new Date('2026-08-20'),
				endDate: new Date('2026-09-02'),
				order: 2,
				project: { connect: { id: 'project-1' } }
			}
		});
	});

	it('requires mentor or owner access for lifecycle changes', async () => {
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
		mockDb.sprint.findUnique.mockResolvedValue(
			projectSprint(SprintStatusEnum.PLANNING) as never
		);

		await expect(
			(await caller()).start({ id: 'sprint-1' })
		).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('requires dates before starting a sprint', async () => {
		mockDb.sprint.findUnique.mockResolvedValue(
			projectSprint(SprintStatusEnum.PLANNING) as never
		);

		await expect(
			(await caller()).start({ id: 'sprint-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'A sprint needs a start and end date before it can start'
		});
	});

	it('only starts planning sprints', async () => {
		mockDb.sprint.findUnique.mockResolvedValue(
			projectSprint(SprintStatusEnum.ACTIVE) as never
		);

		await expect(
			(await caller()).start({ id: 'sprint-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'Only a planning sprint can be started'
		});
		expect(mockDb.sprint.update).not.toHaveBeenCalled();
	});

	it('only completes active sprints', async () => {
		mockDb.sprint.findUnique.mockResolvedValue(
			projectSprint(SprintStatusEnum.PLANNING) as never
		);

		await expect(
			(await caller()).complete({ id: 'sprint-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'Only an active sprint can be completed'
		});
		expect(mockDb.$transaction).not.toHaveBeenCalled();
	});

	it('only deletes planning sprints', async () => {
		mockDb.sprint.findUnique.mockResolvedValue(
			projectSprint(SprintStatusEnum.COMPLETED) as never
		);

		await expect(
			(await caller()).delete({ id: 'sprint-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'Only planning sprints can be deleted'
		});
		expect(mockDb.$transaction).not.toHaveBeenCalled();
	});

	it('clears dates when an edited sprint removes its date range', async () => {
		mockDb.sprint.findUnique.mockResolvedValue(
			projectSprint(SprintStatusEnum.PLANNING) as never
		);
		mockDb.sprint.update.mockResolvedValue({} as never);

		await (await caller()).update({
			id: 'sprint-1',
			startDate: '',
			endDate: ''
		});

		expect(mockDb.sprint.update).toHaveBeenCalledWith({
			where: { id: 'sprint-1' },
			data: { startDate: null, endDate: null }
		});
	});
});
