import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { projectRouter } from '../project';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: null,
		sessionClaims: null,
		sessionId: null,
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

const createCaller = createCallerFactory(projectRouter);

beforeEach(() => {
	mockDb.project.findFirst.mockReset();
});

describe('project.getPublicPortfolio', () => {
	it('does not expose a private repository through a published portfolio', async () => {
		mockDb.competency.findMany.mockResolvedValue([
			{
				slug: 'testing',
				name: 'Testing',
				description: 'Protect behavior with tests.',
				sortOrder: 1,
				reviewCategories: [{ category: 'TESTS' }]
			}
		] as never);
		mockDb.project.findFirst.mockResolvedValue({
			id: 'project-1',
			title: 'Project Alpha',
			description: 'Original description',
			portfolioSummary: 'A useful project',
			portfolioDemoUrl: 'https://demo.example.com',
			portfolioShowDemo: true,
			portfolioShowRepository: true,
			portfolioFeedback: 'Good work',
			portfolioEvaluatedAt: new Date('2026-08-17T00:00:00.000Z'),
			portfolioEvaluatedBy: { name: 'Mentor' },
			updatedAt: new Date('2026-08-17T00:00:00.000Z'),
			category: { name: 'Web' },
			technologies: [{ id: 'tech-1', name: 'TypeScript' }],
			learningOutcomes: [
				{
					id: 'outcome-1',
					value: 'Ship a working feature',
					updatedAt: new Date('2026-08-16T00:00:00.000Z'),
					competencies: [
						{
							competency: {
								slug: 'testing',
								name: 'Testing',
								description: 'Protect behavior with tests.',
								sortOrder: 1
							}
						}
					]
				}
			],
			githubRepository: {
				htmlUrl: 'https://github.com/private/project',
				private: true
			},
			tasks: [
				{
					id: 'task-1',
					title: 'Build the feature',
					publicNumber: 1,
					status: 'DONE',
					portfolioRelevant: true,
					milestoneId: 'milestone-1',
					reviews: [
						{
							status: 'APPROVED',
							updatedAt: new Date('2026-08-17T00:00:00.000Z'),
							githubTitle: 'Add tests',
							prUrl: 'https://github.com/example/project/pull/1',
							analyses: [
								{
									findings: [
										{
											category: 'TESTS',
											editedCategory: null
										}
									]
								}
							]
						}
					]
				}
			],
			milestones: [
				{
					id: 'milestone-1',
					title: 'First delivery',
					description: 'Ship it',
					completed: true,
					updatedAt: new Date('2026-08-16T00:00:00.000Z'),
					reviewedAt: new Date('2026-08-17T00:00:00.000Z'),
					reviewedBy: { name: 'Mentor' },
					competencies: [
						{
							competency: {
								slug: 'testing',
								name: 'Testing',
								description: 'Protect behavior with tests.',
								sortOrder: 1
							}
						}
					]
				}
			]
		} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getPublicPortfolio({ publicCode: 'PROJECT1' });

		expect(result.repositoryUrl).toBeNull();
		expect(result.demoUrl).toBe('https://demo.example.com');
		expect(result.relevantTasks).toEqual([
			{
				id: 'task-1',
				title: 'Build the feature',
				publicNumber: 1,
				status: 'DONE'
			}
		]);
		expect(result.completion.isComplete).toBe(true);
		expect(result.competencies).toEqual([
			{
				slug: 'testing',
				name: 'Testing',
				description: 'Protect behavior with tests.',
				state: 'DEMONSTRATED',
				evidence: expect.arrayContaining([
					expect.objectContaining({
						source: 'PROJECT',
						title: 'First delivery',
						state: 'DEMONSTRATED'
					}),
					expect.objectContaining({
						source: 'PROJECT',
						title: 'Ship a working feature',
						state: 'DEMONSTRATED'
					}),
					expect.objectContaining({
						source: 'PR_REVIEW',
						title: 'Add tests',
						state: 'DEMONSTRATED'
					})
				])
			}
		]);
	});

	it('hides unpublished portfolios', async () => {
		mockDb.project.findFirst.mockResolvedValue(null);
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.getPublicPortfolio({ publicCode: 'PRIVATE' })
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});
});
