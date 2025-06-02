import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { z } from 'zod';

export const baseTaskSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	type: z.nativeEnum(TaskTypeEnum).optional(),
	priority: z.nativeEnum(TaskPriorityEnum).optional(),
	tags: z.array(z.string()).optional(),
	epicId: z.string().optional(),
	sprintId: z.string().optional(),
	blocked: z.boolean().optional(),
	blockedReason: z.string().optional(),
	assigneeId: z.string().optional(),
	status: z.nativeEnum(TaskStatusEnum).optional(),
	order: z.number().optional(),
	storyPoints: z.number().optional(),
	dueDate: z.date().optional()
});

export const createTaskSchema = baseTaskSchema
	.omit({ id: true })
	.extend({
		projectSlug: z.string().optional(),
		projectTemplateSlug: z.string().optional()
	})
	.superRefine((data, ctx) => {
		if (data.projectSlug && data.projectTemplateSlug) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Cannot provide both projectSlug and projectTemplateSlug'
			});
		}
		if (!data.projectSlug && !data.projectTemplateSlug) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Must provide either projectSlug or projectTemplateSlug'
			});
		}
	});

export const updateTaskSchema = baseTaskSchema
	.partial()
	.refine((data) => data.id, {
		message: 'Id is required',
		path: ['id']
	});
