import { PullRequestReviewStatusEnum } from '@prisma/client';
import { z } from 'zod';

export const createPRReviewSchema = z.object({
	taskId: z.string(),
	prUrl: z.string()
});

export const approvePRSchema = z.object({
	taskId: z.string()
});

export const requestChangesPRSchema = z.object({
	taskId: z.string(),
	comment: z.string().optional()
});

export const filterPRReviewsSchema = z.object({
	userId: z.string().optional(),
	status: z.nativeEnum(PullRequestReviewStatusEnum).optional()
});

export const updatePRReviewUrlSchema = z.object({
	reviewId: z.string(),
	prUrl: z.string()
});

export type ApprovePRInput = z.infer<typeof approvePRSchema>;
export type RequestChangesPRInput = z.infer<typeof requestChangesPRSchema>;
export type FilterPRReviewsInput = z.infer<typeof filterPRReviewsSchema>;
export type CreatePRReviewInput = z.infer<typeof createPRReviewSchema>;
