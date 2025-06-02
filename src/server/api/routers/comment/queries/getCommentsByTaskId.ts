import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const getCommentsByTaskId = protectedProcedure
	.input(
		z.object({
			taskId: z.string().min(1, { message: 'Task ID is required' })
		})
	)
	.query(async ({ ctx, input }) => {
		const { taskId } = input;
		const userId = ctx.session.userId;

		// Verify the task exists and user has access to it
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

		// Check if user has access to the task (either through project membership or if it's a template)
		const hasAccess =
			task.projectTemplateId ||
			task.project?.members.some((user: { id: string }) => user.id === userId);

		if (!hasAccess) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You do not have access to this task'
			});
		}

		// Get comments for the task
		const comments = await ctx.db.comment.findMany({
			where: { taskId },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true
					}
				}
			},
			orderBy: {
				createdAt: 'asc'
			}
		});

		return comments;
	});
