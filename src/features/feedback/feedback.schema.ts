import { z } from 'zod';

export const feedbackTypeSchema = z.enum([
	'BUG',
	'SUGGESTION',
	'QUESTION',
	'OTHER'
]);
export const feedbackStatusSchema = z.enum([
	'OPEN',
	'IN_REVIEW',
	'RESOLVED',
	'DISMISSED'
]);

export const createFeedbackInputSchema = z.object({
	type: feedbackTypeSchema,
	title: z.string().trim().min(3).max(120),
	description: z.string().trim().min(10).max(4000),
	url: z.string().trim().url().max(2048),
	userAgent: z.string().trim().max(1000).default(''),
	browser: z.string().trim().max(120).optional(),
	viewportWidth: z.number().int().positive().max(10000).optional(),
	viewportHeight: z.number().int().positive().max(10000).optional(),
	screenshotUrl: z.string().url().max(2048).optional(),
	screenshotKey: z.string().trim().max(500).optional()
});

export const listFeedbackInputSchema = z.object({
	status: feedbackStatusSchema.optional(),
	type: feedbackTypeSchema.optional(),
	search: z.string().trim().max(120).optional(),
	skip: z.number().int().min(0).default(0),
	take: z.number().int().min(1).max(100).default(50)
});
