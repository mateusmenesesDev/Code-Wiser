import { z } from 'zod';

const sprintFields = {
	title: z.string().trim().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional()
};

const validateSprintDates = <T extends z.AnyZodObject>(schema: T) =>
	schema.superRefine((data, ctx) => {
		const { startDate, endDate } = data as {
			startDate?: string;
			endDate?: string;
		};

		if (Boolean(startDate) !== Boolean(endDate)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Start and end dates must be provided together',
				path: ['startDate']
			});
			return;
		}

		if (startDate && endDate && endDate < startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End date must be on or after the start date',
				path: ['endDate']
			});
		}
	});

export const baseSprintSchema = validateSprintDates(
	z.object({
		id: z.string(),
		...sprintFields,
		projectId: z.string().optional(),
		projectTemplateId: z.string().optional()
	})
);

export const newSprintSchema = validateSprintDates(
	z.object({
		...sprintFields,
		isTemplate: z.boolean(),
		projectId: z.string().min(1, { message: 'Project ID is required' })
	})
);

export const updateSprintSchema = validateSprintDates(
	z
		.object({ id: z.string().min(1, { message: 'Sprint ID is required' }) })
		.merge(z.object(sprintFields).partial())
);

export const updateSprintOrderSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			order: z.number()
		})
	)
});
