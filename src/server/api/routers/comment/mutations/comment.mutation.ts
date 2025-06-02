import { createCommentSchema } from '~/features/workspace/schemas/comment.schema';
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
							name: true
						}
					}
				}
			});

			return comment;
		})
};
