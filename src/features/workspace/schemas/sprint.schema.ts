import { z } from 'zod';

export const baseSprintSchema = z.object({
	id: z.string().optional(),
	title: z.string({
		required_error: 'Title is required'
	}),
	description: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	projectId: z.string().optional(),
	projectTemplateId: z.string().optional()
});

export const newSprintSchema = baseSprintSchema
	.omit({ id: true })
	.refine((data) => !!data.projectId || !!data.projectTemplateId, {
		message: 'Either projectId or projectTemplateId must be provided'
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

export const updateSprintOrderSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			order: z.number()
		})
	)
});
