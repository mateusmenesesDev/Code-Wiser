import { beforeEach, describe, expect, it } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import {
	assertProjectResourceAccess,
	assertTaskAccess,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from './auth';

const memberContext = {
	db: mockDb,
	session: { userId: 'user-1' },
	isAdmin: false
};

const adminContext = {
	db: mockDb,
	session: { userId: 'admin-1' },
	isAdmin: true
};

describe('resource access', () => {
	beforeEach(() => {
		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'user-1' }]
		} as never);
	});

	it('allows a project member and rejects a non-member', async () => {
		await expect(
			userHasAccessToProject(memberContext, 'project-1')
		).resolves.toBe(true);

		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'other-user' }]
		} as never);

		await expect(
			userHasAccessToProject(memberContext, 'project-1')
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('allows an admin to access projects and templates', async () => {
		await expect(
			userHasAccessToProject(adminContext, 'project-1')
		).resolves.toBe(true);

		mockDb.projectTemplate.findUnique.mockResolvedValue({
			id: 'template-1'
		} as never);
		await expect(
			userHasAccessToProjectTemplate(adminContext, 'template-1')
		).resolves.toBe(true);
	});

	it('restricts template resources to admins', async () => {
		await expect(
			assertProjectResourceAccess(memberContext, {
				projectId: null,
				projectTemplateId: 'template-1'
			})
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('rejects resources attached to both a project and a template', async () => {
		await expect(
			assertProjectResourceAccess(adminContext, {
				projectId: 'project-1',
				projectTemplateId: 'template-1'
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
	});

	it('checks the project behind a task before granting access', async () => {
		mockDb.task.findUnique.mockResolvedValue({
			projectId: 'project-1',
			projectTemplateId: null,
			project: { members: [{ id: 'other-user' }] }
		} as never);
		mockDb.project.findUnique.mockResolvedValue({
			members: [{ id: 'other-user' }]
		} as never);

		await expect(
			assertTaskAccess(memberContext, 'task-1')
		).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});
});
