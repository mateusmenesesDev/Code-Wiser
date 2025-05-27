import type { Epic, Task } from '@prisma/client';
import { z } from 'zod';

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export interface Column {
	id: string;
	title: string;
	tasks: Task[];
	limit?: number; // WIP limit for kanban
}

export type EpicWithTasks = Epic & {
	tasks: Task[];
};
