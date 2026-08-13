import { ProductVersionStatusEnum, TaskTypeEnum } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { productVersionRouter } from './productVersion.router';

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: 'user-1',
		sessionClaims: { sub: 'user-1' },
		sessionId: 'test-session-id',
		getToken: () => Promise.resolve('test-token'),
		has: () => false
	})
}));

vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

const caller = async () =>
	createCallerFactory(productVersionRouter)(
		await createTRPCContext({ headers: new Headers() })
	);

const projectVersion = (status: ProductVersionStatusEnum) => ({
	id: 'version-1',
	name: 'MVP',
	description: null,
	order: 0,
	status,
	projectId: 'project-1',
	projectTemplateId: null
});

describe('product version lifecycle', () => {
	beforeEach(() => {
		mockDb.project.findUnique.mockResolvedValue({
			canceledAt: null,
			memberships: [
				{
					userId: 'user-1',
					role: 'MENTOR',
					status: 'ACTIVE',
					joinedAt: new Date()
				}
			]
		} as never);
	});

	it('starts a planned project version', async () => {
		mockDb.productVersion.findUnique.mockResolvedValue(
			projectVersion(ProductVersionStatusEnum.PLANNED) as never
		);
		mockDb.productVersion.update.mockResolvedValue({
			...projectVersion(ProductVersionStatusEnum.IN_PROGRESS)
		} as never);

		await (await caller()).start({ id: 'version-1' });

		expect(mockDb.productVersion.update).toHaveBeenCalledWith({
			where: { id: 'version-1' },
			data: { status: ProductVersionStatusEnum.IN_PROGRESS }
		});
	});

	it('does not complete an empty version', async () => {
		mockDb.productVersion.findUnique.mockResolvedValue(
			projectVersion(ProductVersionStatusEnum.IN_PROGRESS) as never
		);
		mockDb.task.count.mockResolvedValue(0);

		await expect(
			(await caller()).complete({ id: 'version-1' })
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'A version needs at least one User Story before completion'
		});
		expect(mockDb.productVersion.update).not.toHaveBeenCalled();
	});
});

describe('product version assignments', () => {
	beforeEach(() => {
		mockDb.project.findUnique.mockResolvedValue({
			canceledAt: null,
			memberships: [
				{
					userId: 'user-1',
					role: 'LEARNER',
					status: 'ACTIVE',
					joinedAt: new Date()
				}
			]
		} as never);
	});

	it('rejects non-User Stories', async () => {
		mockDb.task.findMany.mockResolvedValue([
			{ id: 'task-1', type: TaskTypeEnum.TASK }
		] as never);

		await expect(
			(await caller()).updateStoryAssignments({
				projectId: 'project-1',
				isTemplate: false,
				updates: [{ taskId: 'task-1', versionId: 'version-1', order: 0 }]
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			message: 'Only User Stories can belong to a product version'
		});
		expect(mockDb.$transaction).not.toHaveBeenCalled();
	});
});
