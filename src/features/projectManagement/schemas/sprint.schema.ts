import { z } from 'zod';

export const newSprintTemplateSchema = z.object({
	title: z.string({
		required_error: 'Title is required'
	}),
	description: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	projectSlug: z.string()
});

export const newSprintSchema = z.object({
	title: z.string({
		required_error: 'Title is required'
	}),
	description: z.string().optional(),
	startDate: z.string(),
	endDate: z.string(),
	projectSlug: z.string()
});
