import { clerkClient } from '@clerk/nextjs/server';
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
			task.project?.members.some((user: { id: string }) => user.id === userId);

		if (!hasAccess) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You do not have access to this task'
			});
		}

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
				createdAt: 'desc'
			}
		});

		const commentsWithImageUrl = await Promise.all(
			comments.map(async (comment) => {
				const authorImageUrl = await clerkClient.users.getUser(
					comment.author.id
				);
				return {
					...comment,
					authorImageUrl: authorImageUrl.imageUrl
				};
			})
		);

		return commentsWithImageUrl;
	});
