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
