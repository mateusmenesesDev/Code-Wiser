import { ProjectMethodologyEnum } from '@prisma/client';
import { z } from 'zod';

export const createProjectSchema = z.object({
	projectTemplateId: z.string(),
	idempotencyKey: z.string().uuid()
});

export const updateProjectSchema = z.object({
	id: z.string(),
	title: z.string().min(1).optional(),
	description: z.string().optional(),
	methodology: z.nativeEnum(ProjectMethodologyEnum).optional()
});

const publicHttpUrlSchema = z
	.string()
	.trim()
	.url()
	.refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
		message: 'URL must use HTTP or HTTPS'
	});

export const updatePortfolioSchema = z.object({
	projectId: z.string(),
	summary: z.string().trim().max(5000).nullable(),
	demoUrl: publicHttpUrlSchema.nullable(),
	published: z.boolean(),
	showDemo: z.boolean(),
	showRepository: z.boolean(),
	relevantTaskIds: z.array(z.string()).max(200)
});

export const evaluatePortfolioSchema = z.object({
	projectId: z.string(),
	feedback: z.string().trim().min(1).max(5000)
});
