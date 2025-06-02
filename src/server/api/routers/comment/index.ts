import { createTRPCRouter } from '~/server/api/trpc';
import { commentMutations } from './mutations/comment.mutation';
import { getCommentsByTaskId } from './queries/getCommentsByTaskId';

export const commentRouter = createTRPCRouter({
	...commentMutations,
	getByTaskId: getCommentsByTaskId
});
