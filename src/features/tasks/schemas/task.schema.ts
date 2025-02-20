import { TaskPriorityEnum, TaskTypeEnum } from '@prisma/client';
import { z } from 'zod';

export const createTaskSchema = z.object({
	projectTemplateName: z.string(),
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	type: z.nativeEnum(TaskTypeEnum).optional(),
	priority: z.nativeEnum(TaskPriorityEnum).optional(),
	tags: z.array(z.string()).optional(),
	epicId: z.string().optional(),
	sprintId: z.string().optional()
});

export const updateTaskSprintSchema = z.object({
	taskId: z.string(),
	sprintId: z.string()
});

export const updateTaskEpicSchema = z.object({
	taskId: z.string(),
	epicId: z.string()
});

export const updateTaskSchema = z.object({
	taskId: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	priority: z.nativeEnum(TaskPriorityEnum).optional(),
	tags: z.array(z.string()).optional(),
	epicId: z.string().optional(),
	sprintId: z.string().optional()
});
