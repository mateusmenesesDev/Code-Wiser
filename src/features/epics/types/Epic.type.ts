import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type {
	baseEpicSchema,
	newEpicSchema,
	updateEpicSchema
} from '../schemas/epics.schema';

export type Epic = z.infer<typeof baseEpicSchema>;
export type EpicInput = z.infer<typeof newEpicSchema>;
export type EpicUpdateInput = z.infer<typeof updateEpicSchema>;

export type EpicsApiOutput = RouterOutputs['epic']['getAllByProjectId'];
export type EpicApiOutput = RouterOutputs['epic']['getById'];
