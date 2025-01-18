import type { z } from 'zod';
import type { epicSchema } from '~/features/epics/schemas/epics.schema';

export type Epic = z.infer<typeof epicSchema>;
