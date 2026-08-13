import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectRouter } from '../project';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('project.getRoadmap', () => {
	const createCaller = createCallerFactory(projectRouter);

	beforeEach(() => {
		mockDb.project.findUnique.mockReset();
	});

	it('derives progress and blockers from milestone-linked work', async () => {
		mockDb.project.findUnique
			.mockResolvedValueOnce({
				memberships: [
					{
						userId: 'user-1',
						role: 'LEARNER',
						status: 'ACTIVE',
						joinedAt: new Date()
					}
				]
			} as never)
			.mockResolvedValueOnce({
				id: 'project-1',
				title: 'Project Alpha',
				canceledAt: null,
				learningOutcomes: [{ id: 'outcome-1', value: 'Ship the feature' }],
				milestones: [
					{
						id: 'milestone-1',
						title: 'First delivery',
						description: null,
						order: 0,
						reviewedAt: null,
						reviewedBy: null,
						tasks: [
							{
								id: 'task-1',
								title: 'Build API',
								status: 'DONE',
								blocked: false
							}
						],
						epics: [
							{
								id: 'epic-1',
								title: 'Backend',
								tasks: [
									{
										id: 'task-2',
										title: 'Add validation',
										status: 'IN_PROGRESS',
										blocked: true
									}
								]
							}
						],
						sprints: []
					}
				]
			} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getRoadmap({ projectId: 'project-1' });

		expect(result.milestones[0]).toMatchObject({
			taskCount: 2,
			doneCount: 1,
			progress: 50,
			blockedTaskCount: 1
		});
		expect(result.learningOutcomes).toEqual([
			{ id: 'outcome-1', value: 'Ship the feature' }
		]);
	});

	it('rejects a learner outside the project', async () => {
		mockDb.project.findUnique.mockResolvedValueOnce({
			memberships: []
		} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.getRoadmap({ projectId: 'project-1' })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});
});
