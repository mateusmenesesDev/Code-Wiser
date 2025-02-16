import type { z } from 'zod';
import type {
	newSprintSchema,
	newSprintTemplateSchema
} from '../schemas/sprint.schema';

export type NewSprintTemplate = z.infer<typeof newSprintTemplateSchema>;
export type NewSprint = z.infer<typeof newSprintSchema>;
