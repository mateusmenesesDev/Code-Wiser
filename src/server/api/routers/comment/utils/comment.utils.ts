import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const checkUserHasAccessToTask = async (
	ctx: { db: PrismaClient; session: { userId: string } },
	taskId: string
): Promise<boolean> => {
	const task = await ctx.db.task.findUnique({
		where: { id: taskId },
		include: {
			project: {
				include: {
					members: true
				}
			}
		}
	});

	if (!task) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Task not found'
		});
	}

	const hasAccess =
		task.projectTemplateId ||
		task.project?.members.some(
			(user: { id: string }) => user.id === ctx.session.userId
		);

	if (!hasAccess) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this task'
		});
	}

	return true;
};
