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

describe('projectTemplate version lifecycle', () => {
	const createCaller = createCallerFactory(projectTemplateRouter);

	beforeEach(() => {
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
	});

	it('creates a pending version from the latest approved content', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		mockDb.projectTemplate.findUnique.mockResolvedValueOnce({
			templateKey: 'template-family'
		} as never);
		mockDb.projectTemplate.findFirst.mockResolvedValue({
			id: 'version-1',
			templateKey: 'template-family',
			version: 1,
			title: 'Dashboard',
			status: 'APPROVED',
			sortOrder: 2,
			category: { id: 'category-1' },
			technologies: [],
			sprints: [],
			epics: [],
			tasks: [],
			productVersions: [],
			learningOutcomes: [
				{
					id: 'outcome-1',
					value: 'Ship a feature',
					competencies: [{ competencyId: 'competency-1' }]
				}
			],
			milestones: [
				{
					id: 'milestone-1',
					title: 'Deliver it',
					description: null,
					order: 0,
					status: 'PENDING',
					completed: false,
					competencies: [{ competencyId: 'competency-2' }]
				}
			],
			images: []
		} as never);
		mockDb.projectTemplate.create.mockResolvedValue({
			id: 'version-2'
		} as never);

		const newVersionId = await caller.createVersion({
			id: 'version-1',
			changeSummary: 'Clarify the first milestone'
		});

		expect(newVersionId).toBe('version-2');
		expect(mockDb.projectTemplate.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				templateKey: 'template-family',
				version: 2,
				status: 'PENDING',
				changeSummary: 'Clarify the first milestone',
				sortOrder: 2,
				title: 'Dashboard'
			})
		});
		expect(mockDb.competencyLearningOutcome.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					competencyId: 'competency-1',
					learningOutcomeId: expect.any(String)
				})
			]
		});
		expect(mockDb.competencyMilestone.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({
					competencyId: 'competency-2',
					milestoneId: expect.any(String)
				})
			]
		});
	});

	it('requires editorial review before publishing a draft', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		mockDb.projectTemplate.findUnique.mockResolvedValue({
			id: 'version-2',
			title: 'Dashboard',
			version: 2,
			status: 'PENDING'
		} as never);
		mockDb.projectTemplate.update.mockResolvedValue({
			id: 'version-2',
			title: 'Dashboard',
			version: 2,
			status: 'SEND_FOR_APPROVAL',
			publishedAt: null,
			reviewNote: null
		} as never);

		await caller.updateStatus({
			id: 'version-2',
			status: 'SEND_FOR_APPROVAL'
		});
		await expect(
			caller.updateStatus({ id: 'version-2', status: 'APPROVED' })
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });

		expect(mockDb.projectTemplate.update).toHaveBeenCalledWith({
			where: { id: 'version-2' },
			data: expect.objectContaining({
				status: 'SEND_FOR_APPROVAL',
				publishedAt: null
			}),
			select: expect.any(Object)
		});
	});

	it('does not allow editing an approved version in place', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		mockDb.projectTemplate.findUnique.mockResolvedValue({
			id: 'version-1',
			status: 'APPROVED'
		} as never);

		await expect(
			caller.update({ id: 'version-1', title: 'Changed title' })
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
	});

	it('does not allow changing status of an approved version', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		mockDb.projectTemplate.findUnique.mockResolvedValue({
			id: 'version-1',
			status: 'APPROVED'
		} as never);
		const updateCallsBefore = mockDb.projectTemplate.update.mock.calls.length;

		await expect(
			caller.updateStatus({ id: 'version-1', status: 'APPROVED' })
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.projectTemplate.update.mock.calls.length).toBe(
			updateCallsBefore
		);
	});

	it('rejects a duplicate title from another template family', async () => {
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		mockDb.projectTemplate.findUnique
			.mockResolvedValueOnce({ id: 'version-2', status: 'PENDING' } as never)
			.mockResolvedValueOnce({ templateKey: 'family-2' } as never);
		mockDb.projectTemplate.findFirst.mockResolvedValue({
			id: 'other-template'
		} as never);

		await expect(
			caller.update({ id: 'version-2', title: 'Dashboard' })
		).rejects.toMatchObject({ code: 'CONFLICT' });
	});
});
