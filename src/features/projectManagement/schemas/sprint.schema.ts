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

export const updateSprintSchema = z
	.object({
		id: z.string(),
		title: z.string().optional(),
		description: z.string().optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional()
	})
	.superRefine((data, ctx) => {
		if (data.startDate && !data.endDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End date is required if start date is provided'
			});
		}
		if (data.endDate && !data.startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Start date is required if end date is provided'
			});
		}
	});
