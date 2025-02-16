import type { z } from 'zod';
import type { newSprintSchema } from '../schemas/sprint.schema';

export type NewSprint = z.infer<typeof newSprintSchema>;
