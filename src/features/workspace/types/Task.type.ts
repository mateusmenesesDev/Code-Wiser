import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type {
	createTaskSchema,
	updateTaskSchema
} from '../schemas/task.schema';

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type TasksApiOutput = RouterOutputs['task']['getAllByProjectId'];
export type TaskApiOutput = RouterOutputs['task']['getById'];
