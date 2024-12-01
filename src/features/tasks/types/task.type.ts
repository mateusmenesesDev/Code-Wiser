import { TaskPriorityEnum, TaskTypeEnum } from '@prisma/client';
import { z } from 'zod';

export const taskSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	type: z.nativeEnum(TaskTypeEnum).default(TaskTypeEnum.USER_STORY),
	priority: z.nativeEnum(TaskPriorityEnum).default(TaskPriorityEnum.MEDIUM),
	tags: z.string().optional(),
	projectTemplateName: z.string()
});

export type CreateTask = z.infer<typeof taskSchema>;
