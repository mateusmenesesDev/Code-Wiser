import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { z } from 'zod';

// Task schema for bulk creation (without projectId/projectTemplateId)
const bulkTaskSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	type: z.nativeEnum(TaskTypeEnum).optional(),
	priority: z.nativeEnum(TaskPriorityEnum).optional(),
	tags: z.array(z.string()).optional(),
	epicTitle: z.string().nullable().optional(), // Reference by title instead of ID
	sprintTitle: z.string().nullable().optional(), // Reference by title instead of ID
	blocked: z.boolean().optional(),
	blockedReason: z.string().optional(),
	status: z.nativeEnum(TaskStatusEnum).optional(),
	order: z.number().optional(),
	storyPoints: z.number().optional(),
	dueDate: z.string().optional(), // ISO date string
	prUrl: z.string().optional()
});

// Sprint schema for bulk creation
const bulkSprintSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	startDate: z.string().optional(), // ISO date string
	endDate: z.string().optional(), // ISO date string
	order: z.number().optional()
});

// Epic schema for bulk creation
const bulkEpicSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional()
});

export const bulkCreateSchema = z.object({
	tasks: z.array(bulkTaskSchema).optional().default([]),
	sprints: z.array(bulkSprintSchema).optional().default([]),
	epics: z.array(bulkEpicSchema).optional().default([])
});

export type BulkCreateInput = z.infer<typeof bulkCreateSchema>;
