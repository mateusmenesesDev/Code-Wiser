import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectTemplateApiResponse } from '~/features/projects/types/Projects.type';
import mockDb from '~/server/__mocks__/db';
import { appRouter } from '~/server/api/root';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'test-user-id',
		sessionClaims: { sub: 'test-user-id' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token')
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

describe('project template procedures testing', () => {
	const createCaller = createCallerFactory(appRouter);
	let caller: ReturnType<typeof createCaller>;

	beforeEach(async () => {
		const ctx = await createTRPCContext({
			headers: new Headers()
		});

		caller = createCaller(ctx);
	});

	it('should return all project templates', async () => {
		const mockProjectTemplate: ProjectTemplateApiResponse = {
			id: 'test-id',
			slug: 'test-slug',
			title: 'Test Project',
			description: 'Test Description',
			difficulty: 'BEGINNER',
			methodology: 'SCRUM',
			status: 'PENDING',
			type: 'MENTORSHIP',
			expectedDuration: '1',
			minParticipants: 1,
			maxParticipants: 5,
			credits: 10,
			categoryId: 'test-category',
			createdAt: new Date(),
			updatedAt: new Date(),
			category: { name: 'test-category' },
			technologies: [
				{ id: 'test-technology', name: 'test-technology', approved: true }
			]
		};

		mockDb.projectTemplate.findMany.mockResolvedValue([mockProjectTemplate]);
		// Then try to get it
		const result = await caller.projectTemplate.getAll();
		expect(result).toBeDefined();
		expect(result).toMatchObject([mockProjectTemplate]);
	});
});
