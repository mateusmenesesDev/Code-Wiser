import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectTemplateRouter } from '../../projectTemplate';
import { sortApprovedCatalog } from './approvedCatalogQuery';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'test-user-id',
		sessionClaims: { sub: 'test-user-id' },
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

describe('projectTemplate.getApproved', () => {
	const createCaller = createCallerFactory(projectTemplateRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		caller = createCaller(await createTRPCContext({ headers: new Headers() }));
	});

	it('loads catalog cards with task counts instead of full task graphs', async () => {
		const leanRow = {
			id: 'template-1',
			title: 'Lean Catalog Template',
			description: 'Card metadata only',
			difficulty: 'BEGINNER',
			methodology: 'SCRUM',
			status: 'APPROVED',
			accessType: 'FREE',
			expectedDuration: '2 weeks',
			minParticipants: 1,
			maxParticipants: 3,
			credits: null,
			categoryId: 'cat-1',
			createdAt: new Date(),
			updatedAt: new Date(),
			sortOrder: 0,
			figmaProjectUrl: null,
			publicCode: 'LEAN',
			nextTaskNumber: 1,
			preRequisites: [],
			category: { id: 'cat-1', name: 'Fullstack', approved: true },
			technologies: [{ id: 'tech-1', name: 'React', approved: true }],
			images: [{ url: 'https://example.com/cover.png', alt: 'Cover' }],
			_count: { tasks: 12 }
		};

		mockDb.projectTemplate.findMany.mockResolvedValue([leanRow] as never);

		const result = await caller.getApproved();

		expect(result).toEqual([leanRow]);
		expect(mockDb.projectTemplate.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { status: 'APPROVED' },
				include: expect.objectContaining({
					category: true,
					technologies: true,
					images: expect.any(Object),
					_count: { select: { tasks: true } }
				})
			})
		);

		const call = mockDb.projectTemplate.findMany.mock.calls[0]?.[0] as {
			include: Record<string, unknown>;
		};
		expect(call.include.tasks).toBeUndefined();
		expect(call.include.epics).toBeUndefined();
		expect(call.include.sprints).toBeUndefined();
		expect(call.include.learningOutcomes).toBeUndefined();
		expect(call.include.milestones).toBeUndefined();
	});

	it('pushes catalog filters into the approved-template query', async () => {
		mockDb.projectTemplate.findMany.mockResolvedValue([]);

		await caller.getApproved({
			search: '  react  ',
			category: 'Frontend',
			technologies: ['React', 'TypeScript'],
			difficulty: 'INTERMEDIATE',
			methodology: 'KANBAN',
			accessType: 'FREE',
			sort: 'newest'
		});

		expect(mockDb.projectTemplate.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					status: 'APPROVED',
					OR: [
						{ title: { contains: 'react', mode: 'insensitive' } },
						{
							description: {
								contains: 'react',
								mode: 'insensitive'
							}
						}
					],
					category: {
						name: { equals: 'Frontend', mode: 'insensitive' }
					},
					technologies: {
						some: {
							OR: [
								{ name: { equals: 'React', mode: 'insensitive' } },
								{ name: { equals: 'TypeScript', mode: 'insensitive' } }
							]
						}
					},
					difficulty: 'INTERMEDIATE',
					methodology: 'KANBAN',
					accessType: 'FREE'
				}),
				orderBy: [{ createdAt: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }]
			})
		);
	});

	it('sorts by relevance, newest, and learner-friendly difficulty order', () => {
		const projects = [
			{
				id: 'advanced',
				title: 'React dashboard',
				description: 'Build a dashboard',
				difficulty: 'ADVANCED',
				sortOrder: 0,
				createdAt: new Date('2026-01-01')
			},
			{
				id: 'beginner',
				title: 'React',
				description: 'Start here',
				difficulty: 'BEGINNER',
				sortOrder: 2,
				createdAt: new Date('2026-03-01')
			},
			{
				id: 'description-match',
				title: 'TypeScript project',
				description: 'A React project',
				difficulty: 'INTERMEDIATE',
				sortOrder: 1,
				createdAt: new Date('2026-02-01')
			}
		] as never;

		expect(
			sortApprovedCatalog(projects, 'relevance', 'React').map(
				(project) => project.id
			)
		).toEqual(['beginner', 'advanced', 'description-match']);
		expect(
			sortApprovedCatalog(projects, 'newest').map((project) => project.id)
		).toEqual(['beginner', 'description-match', 'advanced']);
		expect(
			sortApprovedCatalog(projects, 'difficulty').map((project) => project.id)
		).toEqual(['beginner', 'description-match', 'advanced']);
	});

	it('returns only filter options used by approved templates', async () => {
		mockDb.category.findMany.mockResolvedValue([
			{ name: 'Backend' },
			{ name: 'Frontend' }
		] as never);
		mockDb.technology.findMany.mockResolvedValue([
			{ name: 'React' },
			{ name: 'TypeScript' }
		] as never);

		await expect(caller.getFilterOptions()).resolves.toEqual({
			categories: ['Backend', 'Frontend'],
			technologies: ['React', 'TypeScript']
		});
		expect(mockDb.category.findMany).toHaveBeenCalledWith({
			where: { ProjectTemplate: { some: { status: 'APPROVED' } } },
			orderBy: { name: 'asc' },
			select: { name: true }
		});
	});
});
