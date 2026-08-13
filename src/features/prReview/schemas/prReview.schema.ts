import {
	PRReviewFindingCategory,
	PRReviewFindingSeverity,
	PullRequestReviewStatusEnum
} from '@prisma/client';
import { z } from 'zod';

export const createPRReviewSchema = z.object({
	taskId: z.string(),
	prUrl: z.string(),
	idempotencyKey: z.string().uuid()
});

export const approvePRSchema = z.object({
	taskId: z.string()
});

export const requestChangesPRSchema = z.object({
	taskId: z.string(),
	comment: z.string().max(20_000).optional(),
	analysisId: z.string().optional()
});

export const startAIAnalysisSchema = z.object({
	reviewId: z.string()
});

export const reviewAIFindingSchema = z.object({
	findingId: z.string(),
	decision: z.enum(['ACCEPTED', 'DISCARDED', 'PENDING']).optional(),
	severity: z.nativeEnum(PRReviewFindingSeverity).optional(),
	category: z.nativeEnum(PRReviewFindingCategory).optional(),
	problem: z.string().min(1).max(4_000).optional(),
	justification: z.string().min(1).max(4_000).optional(),
	suggestion: z.string().min(1).max(4_000).optional(),
	confidence: z.number().min(0).max(1).optional()
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
export type StartAIAnalysisInput = z.infer<typeof startAIAnalysisSchema>;
export type ReviewAIFindingInput = z.infer<typeof reviewAIFindingSchema>;
export type FilterPRReviewsInput = z.infer<typeof filterPRReviewsSchema>;
export type CreatePRReviewInput = z.infer<typeof createPRReviewSchema>;
