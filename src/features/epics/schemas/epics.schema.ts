import { z } from 'zod';

export const baseEpicSchema = z.object({
	id: z.string(),
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	projectTemplateId: z.string().optional(),
	projectId: z.string().optional()
});

export const newEpicSchema = baseEpicSchema
	.omit({ id: true })
	.superRefine((data, ctx) => {
		if (!data.projectTemplateId && !data.projectId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Either projectTemplateId or projectId must be provided'
			});
		}
	});

export const updateEpicSchema = baseEpicSchema
	.partial()
	.refine((data) => data.id, {
		message: 'Id is required',
		path: ['id']
	});
