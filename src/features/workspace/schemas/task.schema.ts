import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { z } from 'zod';

export const baseTaskSchema = z.object({
	id: z.string().optional(),
	projectId: z.string(),
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	type: z.nativeEnum(TaskTypeEnum).optional(),
	priority: z.nativeEnum(TaskPriorityEnum).optional(),
	tags: z.array(z.string()).optional(),
	epicId: z.string().nullable().optional(),
	sprintId: z.string().nullable().optional(),
	blocked: z.boolean().optional(),
	blockedReason: z.string().optional(),
	assigneeId: z.string().nullable().optional(),
	status: z.nativeEnum(TaskStatusEnum).optional(),
	order: z.number().optional(),
	storyPoints: z.number().optional(),
	dueDate: z.coerce.date().optional(),
	prUrl: z.string().optional()
});

export const createTaskSchema = baseTaskSchema
	.omit({ id: true })
	.extend({ isTemplate: z.boolean() });

export const updateTaskSchema = baseTaskSchema
	.partial()
	.extend({ isTemplate: z.boolean() })
	.refine((data) => data.id, {
		message: 'Id is required',
		path: ['id']
	});
