import { z } from 'zod';

const sprintFields = {
	title: z.string({
		required_error: 'Title is required'
	}),
	description: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional()
};

export const baseSprintSchema = z.object({
	id: z.string(),
	...sprintFields,
	projectId: z.string().optional(),
	projectTemplateId: z.string().optional()
});

export const newSprintSchema = z.object({
	...sprintFields,
	isTemplate: z.boolean(),
	projectId: z.string({ required_error: 'Project ID is required' }).min(1, {
		message: 'Project ID is required'
	})
});

export const updateSprintSchema = z
	.object({
		id: z.string({ required_error: 'Sprint ID is required' }),
		...sprintFields
	})
	.partial()
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
