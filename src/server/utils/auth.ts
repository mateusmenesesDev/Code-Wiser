import { ProjectRoleEnum, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export interface ResourceAccessContext {
	db: PrismaClient;
	session: { userId: string };
	isAdmin: boolean;
}

export type ProjectPermission =
	| 'EDIT_SETTINGS'
	| 'MANAGE_MEMBERS'
	| 'MANAGE_GITHUB'
	| 'MANAGE_PORTFOLIO'
	| 'EVALUATE_PROJECT';

const permissionsByRole: Record<ProjectRoleEnum, readonly ProjectPermission[]> =
	{
		[ProjectRoleEnum.OWNER]: [
			'EDIT_SETTINGS',
			'MANAGE_MEMBERS',
			'MANAGE_GITHUB',
			'MANAGE_PORTFOLIO'
		],
		[ProjectRoleEnum.MENTOR]: [
			'EDIT_SETTINGS',
			'MANAGE_GITHUB',
			'EVALUATE_PROJECT'
		],
		[ProjectRoleEnum.LEARNER]: []
	};

export const getProjectMembership = async (
	ctx: ResourceAccessContext,
	projectId: string
) => {
	if (ctx.isAdmin) {
		return {
			role: ProjectRoleEnum.OWNER,
			status: 'ACTIVE' as const,
			joinedAt: null,
			permissions: [...permissionsByRole[ProjectRoleEnum.OWNER]],
			isAdmin: true
		};
	}

	const project = await ctx.db.project.findUnique({
		where: { id: projectId },
		select: {
			memberships: {
				where: {
					userId: ctx.session.userId,
					status: 'ACTIVE'
				},
				select: { role: true, status: true, joinedAt: true }
			}
		}
	});

	if (!project) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
	}

	const membership = project.memberships[0];
	return membership
		? {
				...membership,
				permissions: [...permissionsByRole[membership.role]],
				isAdmin: false
			}
		: null;
};

export const userHasAccessToProject = async (
	ctx: ResourceAccessContext,
	projectId: string
): Promise<boolean> => {
	const membership = await getProjectMembership(ctx, projectId);
	if (!membership) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this project'
		});
	}
	return true;
};

export const assertProjectPermission = async (
	ctx: ResourceAccessContext,
	projectId: string,
	permission: ProjectPermission
): Promise<void> => {
	const membership = await getProjectMembership(ctx, projectId);
	if (!membership) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this project'
		});
	}
	if (!membership.permissions.includes(permission)) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have permission to manage this project'
		});
	}
};

export const userHasAccessToProjectTemplate = async (
	ctx: ResourceAccessContext,
	projectTemplateId: string
): Promise<boolean> => {
	if (!ctx.isAdmin) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Only administrators can access project templates'
		});
	}

	const template = await ctx.db.projectTemplate.findUnique({
		where: { id: projectTemplateId },
		select: { id: true }
	});

	if (!template) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Project template not found'
		});
	}

	return true;
};

export const assertProjectResourceAccess = async (
	ctx: ResourceAccessContext,
	resource: { projectId: string | null; projectTemplateId: string | null }
): Promise<void> => {
	if (resource.projectId && resource.projectTemplateId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'A resource cannot belong to both a project and a template'
		});
	}

	if (resource.projectTemplateId) {
		await userHasAccessToProjectTemplate(ctx, resource.projectTemplateId);
		return;
	}

	if (resource.projectId) {
		await userHasAccessToProject(ctx, resource.projectId);
		return;
	}

	throw new TRPCError({
		code: 'FORBIDDEN',
		message: 'This resource is not attached to an accessible project'
	});
};

export const assertTaskAccess = async (
	ctx: ResourceAccessContext,
	taskId: string
) => {
	const task = await ctx.db.task.findUnique({
		where: { id: taskId },
		select: {
			projectId: true,
			projectTemplateId: true,
			project: {
				select: {
					memberships: {
						where: { status: 'ACTIVE' },
						select: { userId: true }
					}
				}
			}
		}
	});

	if (!task) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
	}

	if (task.projectId && task.projectTemplateId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'A task cannot belong to both a project and a template'
		});
	}

	if (task.projectTemplateId) {
		await userHasAccessToProjectTemplate(ctx, task.projectTemplateId);
		return task;
	}

	if (!task.projectId || !task.project) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'This task is not attached to an accessible project'
		});
	}

	await userHasAccessToProject(ctx, task.projectId);
	return task;
};

export const assertProjectIsActive = async (
	db: PrismaClient,
	projectId: string
): Promise<void> => {
	const project = await db.project.findUnique({
		where: { id: projectId },
		select: { canceledAt: true }
	});

	if (!project) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
	}

	if (project.canceledAt) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Project is canceled'
		});
	}
};
