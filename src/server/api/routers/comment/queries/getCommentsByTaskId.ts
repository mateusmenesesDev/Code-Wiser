import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';
import { assertTaskAccess } from '~/server/utils/auth';

export const getCommentsByTaskId = protectedProcedure
	.input(
		z.object({
			taskId: z.string().min(1, { message: 'Task ID is required' })
		})
	)
	.query(async ({ ctx, input }) => {
		const { taskId } = input;
		await assertTaskAccess(ctx, taskId);

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
