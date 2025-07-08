import { z } from 'zod';

export const baseEpicSchema = z.object({
	id: z.string(),
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	projectTemplateId: z.string().optional(),
	projectId: z.string().optional()
});

export const newEpicSchema = baseEpicSchema
	.omit({ id: true, projectTemplateId: true, projectId: true })
	.extend({
		isTemplate: z.boolean(),
		projectId: z.string()
	});

export const updateEpicSchema = baseEpicSchema
	.omit({ projectTemplateId: true, projectId: true })
	.partial()
	.refine((data) => data.id, {
		message: 'Id is required',
		path: ['id']
	});
