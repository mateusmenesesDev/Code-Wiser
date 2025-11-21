import type { PrismaClient } from '@prisma/client';

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
		include: { members: true }
	});

	return project?.members.some((member) => member.id === userId) ?? false;
};
