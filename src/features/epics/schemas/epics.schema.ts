import { EpicStatusEnum } from '@prisma/client';
import { z } from 'zod';

const epicFields = {
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	status: z.nativeEnum(EpicStatusEnum).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional()
};

const validateEpicDates = <T extends z.ZodTypeAny>(schema: T) =>
	schema.superRefine((data: z.infer<T>, ctx) => {
		if (data.startDate && !data.endDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End date is required if start date is provided',
				path: ['endDate']
			});
		}
		if (data.startDate && data.endDate && data.endDate < data.startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'End date must be on or after the start date',
				path: ['endDate']
			});
		}
	});

export const baseEpicSchema = z.object({
	id: z.string(),
	...epicFields,
	projectTemplateId: z.string().optional(),
	projectId: z.string().optional()
});

export const newEpicSchema = validateEpicDates(
	baseEpicSchema
		.omit({ id: true, projectTemplateId: true, projectId: true })
		.extend({
			isTemplate: z.boolean(),
			projectId: z.string()
		})
);

export const updateEpicSchema = validateEpicDates(
	baseEpicSchema
		.omit({ projectTemplateId: true, projectId: true })
		.partial()
		.refine((data) => data.id, {
			message: 'Id is required',
			path: ['id']
		})
);
