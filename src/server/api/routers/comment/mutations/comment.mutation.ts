import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createCommentSchema,
	updateCommentSchema
} from '~/features/workspace/schemas/comment.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { checkUserHasAccessToTask } from '../utils/comment.utils';
import { getBaseUrl } from '~/server/utils/getBaseUrl';
import { notifyTaskComment } from '~/server/services/notification/notificationService';

export const commentMutations = {
	create: protectedProcedure
		.input(createCommentSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, content } = input;
			const userId = ctx.session.userId;

		await checkUserHasAccessToTask(ctx, taskId);

		const task = await ctx.db.task.findUnique({
			where: { id: taskId },
			include: {
				project: {
					select: {
						id: true,
						title: true
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

		const comment = await ctx.db.comment.create({
			data: {
				content,
				taskId,
				authorId: userId
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true
					}
				}
			}
		});

		if (task.projectId && task.project) {
			await notifyTaskComment({
				db: ctx.db,
				commentId: comment.id,
				authorId: userId,
				authorName: comment.author.name,
				taskId: task.id,
				taskTitle: task.title,
				projectId: task.projectId,
				projectName: task.project.title
			}).catch((error) => {
				console.error('Failed to send notification:', error);
			});
		}

		return comment;
		}),

	update: protectedProcedure
		.input(updateCommentSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, content } = input;
			const userId = ctx.session.userId;

			const existingComment = await ctx.db.comment.findUnique({
				where: { id },
				include: { task: true }
			});

			if (!existingComment) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Comment not found'
				});
			}

			if (existingComment.authorId !== userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You can only edit your own comments'
				});
			}

			await checkUserHasAccessToTask(ctx, existingComment.taskId);

			const comment = await ctx.db.comment.update({
				where: { id },
				data: { content },
				include: {
					author: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			return comment;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;
			const userId = ctx.session.userId;

			const existingComment = await ctx.db.comment.findUnique({
				where: { id },
				include: { task: true }
			});

			if (!existingComment) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Comment not found'
				});
			}

			if (existingComment.authorId !== userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You can only delete your own comments'
				});
			}

		await checkUserHasAccessToTask(ctx, existingComment.taskId);

		const task = await ctx.db.task.findUnique({
			where: { id: existingComment.taskId },
			select: {
				projectId: true
			}
		});

		await ctx.db.comment.delete({ where: { id } });

		if (task?.projectId) {
			const baseUrl = getBaseUrl();
			const workspaceUrl = `${baseUrl}/workspace/${task.projectId}?taskId=${existingComment.taskId}`;

			await ctx.db.notification.deleteMany({
				where: {
					type: 'TASK_COMMENT',
					link: workspaceUrl
				}
			});
		}

		return { success: true };
		})
};
