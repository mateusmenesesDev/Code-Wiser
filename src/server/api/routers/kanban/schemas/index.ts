import { z } from 'zod';

import { TaskPriorityEnum } from '@prisma/client';

export const kanbanDataSchema = z.object({
	projectId: z.string(),
	includeBacklog: z.boolean().default(false),
	filters: z
		.object({
			sprintId: z.string().optional(),
			priority: z.nativeEnum(TaskPriorityEnum).optional().nullable(),
			assigneeId: z.string().optional(),
			epicId: z.string().optional()
		})
		.optional()
});
