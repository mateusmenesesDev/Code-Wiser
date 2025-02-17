import type { z } from 'zod';
import type {
	newSprintSchema,
	updateSprintSchema
} from '../schemas/sprint.schema';

export type NewSprint = z.infer<typeof newSprintSchema>;
export type UpdateSprint = z.infer<typeof updateSprintSchema>;
