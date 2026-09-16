import { z } from 'zod';

export const learningPlanTargetTypeSchema = z.enum([
	'TASK',
	'EXERCISE',
	'REMEDIATION',
	'MENTORSHIP',
	'COHORT_EVENT',
	'CUSTOM'
]);

export const learningPlanStatusSchema = z.enum([
	'PLANNED',
	'IN_PROGRESS',
	'COMPLETED',
	'SKIPPED'
]);

export const learningPlanScopeSchema = z.object({
	learnerId: z.string().min(1).optional()
});

export const learningPlanDetailsSchema = z.object({
	title: z.string().trim().min(1).max(160),
	objective: z.string().trim().max(1000).nullable().optional()
});

export const learningPlanItemSchema = z.object({
	itemId: z.string().min(1),
	title: z.string().trim().min(1).max(160).optional(),
	reason: z.string().trim().min(1).max(1000).optional(),
	dueAt: z.coerce.date().nullable().optional(),
	status: learningPlanStatusSchema.optional(),
	dependencyIds: z.array(z.string().min(1)).max(10).optional()
});

export const addLearningPlanItemSchema = z.object({
	learnerId: z.string().min(1).optional(),
	title: z.string().trim().max(160).optional(),
	reason: z.string().trim().min(1).max(1000),
	dueAt: z.coerce.date().nullable().optional(),
	targetType: learningPlanTargetTypeSchema,
	targetId: z.string().min(1).optional(),
	targetHref: z
		.string()
		.regex(/^\/(?!\/)/)
		.max(300)
		.optional(),
	dependencyIds: z.array(z.string().min(1)).max(10).default([])
});

export const reorderLearningPlanItemsSchema = z.object({
	learnerId: z.string().min(1).optional(),
	itemIds: z.array(z.string().min(1)).min(1).max(50)
});
