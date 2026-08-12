import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export interface ResourceAccessContext {
	db: PrismaClient;
	session: { userId: string };
	isAdmin: boolean;
}

export const userHasAccessToProject = async (
	ctx: ResourceAccessContext,
	projectId: string
): Promise<boolean> => {
	const { session, isAdmin } = ctx;
	if (isAdmin) return true;

	const userId = session.userId;

	const project = await ctx.db.project.findUnique({
		where: { id: projectId },
		select: {
			members: {
				select: {
					id: true
				}
			}
		}
	});

	if (!project) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
	}

	const isMember = project.members.some(
		(member: { id: string }) => member.id === userId
	);

	if (!isMember && !ctx.isAdmin) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this project'
		});
	}

	return isMember;
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
			project: { select: { members: { select: { id: true } } } }
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
