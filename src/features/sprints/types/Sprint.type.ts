import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type {
	newSprintSchema,
	updateSprintSchema
} from '../schemas/sprint.schema';

export type NewSprint = z.infer<typeof newSprintSchema>;
export type UpdateSprint = z.infer<typeof updateSprintSchema>;

export type SprintsApiOutput = RouterOutputs['sprint']['getAllByProjectId'];
export type SprintApiOutput = RouterOutputs['sprint']['getById'];
