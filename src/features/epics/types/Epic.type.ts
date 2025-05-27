import type { z } from 'zod';
import type {
	baseEpicSchema,
	newEpicSchema,
	updateEpicSchema
} from '../schemas/epics.schema';

export type Epic = z.infer<typeof baseEpicSchema>;

export type EpicInput = z.infer<typeof newEpicSchema>;

export type EpicUpdateInput = z.infer<typeof updateEpicSchema>;
