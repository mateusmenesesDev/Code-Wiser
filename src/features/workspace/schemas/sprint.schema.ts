import { z } from 'zod';

export const baseSprintSchema = z.object({
	id: z.string().optional(),
	title: z.string({
		required_error: 'Title is required'
	}),
	description: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	projectSlug: z.string().optional(),
	projectTemplateSlug: z.string().optional()
});

export const newSprintSchema = baseSprintSchema
	.omit({ id: true })
	.refine((data) => !!data.projectSlug || !!data.projectTemplateSlug, {
		message: 'Either projectSlug or projectTemplateSlug must be provided'
	});

export const updateSprintSchema = baseSprintSchema
	.partial()
	.refine((data) => data.id, {
		message: 'Id is required',
		path: ['id']
	})
	.superRefine((data, ctx) => {
		if (data.startDate && !data.endDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End date is required if start date is provided'
			});
		}
	});
