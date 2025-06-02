import { z } from 'zod';

export const createCommentSchema = z.object({
	content: z.string().min(1, { message: 'Comment content is required' }),
	taskId: z.string().min(1, { message: 'Task ID is required' })
});

export const updateCommentSchema = z.object({
	id: z.string().min(1, { message: 'Comment ID is required' }),
	content: z.string().min(1, { message: 'Comment content is required' })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
