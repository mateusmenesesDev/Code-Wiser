import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectTemplateRouter } from '../projectTemplate';

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

describe('projectTemplate.clone bulk inserts', () => {
	const createCaller = createCallerFactory(projectTemplateRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('clones sprints, epics, and tasks with createMany instead of per-row creates', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		mockDb.projectTemplate.findUnique
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: 'template-id',
				title: 'Original',
				description: 'Desc',
				methodology: 'SCRUM',
				minParticipants: 1,
				maxParticipants: 4,
				credits: 10,
				accessType: 'FREE',
				status: 'APPROVED',
				difficulty: 'BEGINNER',
				figmaProjectUrl: null,
				publicCode: 'ORIG',
				nextTaskNumber: 3,
				sortOrder: 0,
				preRequisites: [],
				expectedDuration: null,
				categoryId: 'cat-1',
				createdAt: new Date(),
				updatedAt: new Date(),
				category: { id: 'cat-1', name: 'Fullstack' },
				technologies: [{ id: 'tech-1' }],
				learningOutcomes: [{ value: 'Learn X' }],
				milestones: [{ title: 'M1', description: null, order: 0 }],
				images: [],
				sprints: [
					{
						id: 'sprint-old',
						title: 'Sprint 1',
						description: null,
						order: 0,
						status: 'PLANNING',
						startDate: null,
						endDate: null,
						projectTemplateId: 'template-id',
						projectId: null,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				],
				epics: [
					{
						id: 'epic-old',
						title: 'Epic 1',
						description: null,
						status: null,
						progress: null,
						startDate: null,
						endDate: null,
						projectTemplateId: 'template-id',
						projectId: null,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				],
				tasks: [
					{
						id: 'task-old',
						title: 'Task 1',
						description: null,
						type: 'USER_STORY',
						tags: [],
						priority: null,
						status: 'BACKLOG',
						order: 0,
						dueDate: null,
						publicNumber: 1,
						blocked: false,
						blockedReason: null,
						storyPoints: null,
						assigneeId: null,
						projectId: null,
						projectTemplateId: 'template-id',
						epicId: 'epic-old',
						sprintId: 'sprint-old',
						createdAt: new Date(),
						updatedAt: new Date(),
						epic: { id: 'epic-old', title: 'Epic 1' },
						sprint: { id: 'sprint-old', title: 'Sprint 1' }
					}
				]
			} as never);

		mockDb.projectTemplate.aggregate.mockResolvedValue({
			_max: { sortOrder: 0 }
		} as never);
		mockDb.projectTemplate.create.mockResolvedValue({
			id: 'cloned-id'
		} as never);
		mockDb.sprint.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.epic.createMany.mockResolvedValue({ count: 1 } as never);
		mockDb.task.createMany.mockResolvedValue({ count: 1 } as never);

		const clonedId = await caller.clone({
			id: 'template-id',
			newTitle: 'Cloned Template'
		});

		expect(clonedId).toBe('cloned-id');
		expect(mockDb.sprint.create).not.toHaveBeenCalled();
		expect(mockDb.epic.create).not.toHaveBeenCalled();
		expect(mockDb.task.create).not.toHaveBeenCalled();
		expect(mockDb.sprint.createMany).toHaveBeenCalledTimes(1);
		expect(mockDb.epic.createMany).toHaveBeenCalledTimes(1);
		expect(mockDb.task.createMany).toHaveBeenCalledTimes(1);

		const taskData = (
			mockDb.task.createMany.mock.calls[0]?.[0] as {
				data: Array<{
					epicId: string | null;
					sprintId: string | null;
					projectTemplateId: string;
				}>;
			}
		).data[0];

		expect(taskData?.projectTemplateId).toBe('cloned-id');
		expect(taskData?.epicId).not.toBe('epic-old');
		expect(taskData?.sprintId).not.toBe('sprint-old');
		expect(taskData?.epicId).toEqual(expect.any(String));
		expect(taskData?.sprintId).toEqual(expect.any(String));
	});
});
