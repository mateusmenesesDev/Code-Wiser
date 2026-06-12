import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

interface UserHasAccessToProjectContext {
	db: PrismaClient;
	session: { userId: string };
	isAdmin: boolean;
}

export const userHasAccessToProject = async (
	ctx: UserHasAccessToProjectContext,
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
