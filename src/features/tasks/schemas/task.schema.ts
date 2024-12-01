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
