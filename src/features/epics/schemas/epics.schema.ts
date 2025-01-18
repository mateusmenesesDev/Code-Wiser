import { z } from 'zod';

export const epicSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	projectTemplateId: z.string().min(1, 'Project Template ID is required')
});

export type Epic = z.infer<typeof epicSchema>;
