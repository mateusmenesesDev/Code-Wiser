import { z } from 'zod';

export const newSprintSchema = z
	.object({
		title: z.string({
			required_error: 'Title is required'
		}),
		description: z.string().optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		projectSlug: z.string().optional(),
		projectTemplateSlug: z.string().optional()
	})
	.refine((data) => !!data.projectSlug || !!data.projectTemplateSlug, {
		message: 'Either projectSlug or projectTemplateSlug must be provided'
	});
