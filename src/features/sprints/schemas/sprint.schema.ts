import { z } from 'zod';

const sprintFields = {
	title: z.string().min(1, { message: 'Title is required' }),
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
	projectId: z.string().min(1, { message: 'Project ID is required' })
});

export const updateSprintSchema = z
	.object({
		id: z.string().min(1, { message: 'Sprint ID is required' }),
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
