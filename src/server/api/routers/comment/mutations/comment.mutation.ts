import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createCommentSchema,
	updateCommentSchema
} from '~/features/workspace/schemas/comment.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { checkUserHasAccessToTask } from '../utils/comment.utils';

export const commentMutations = {
	create: protectedProcedure
		.input(createCommentSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, content } = input;
			const userId = ctx.session.userId;

			await checkUserHasAccessToTask(ctx, taskId);

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

			await ctx.db.comment.delete({ where: { id } });

			return { success: true };
		})
};
