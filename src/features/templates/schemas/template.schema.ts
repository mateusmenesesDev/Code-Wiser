import { ProjectStatusEnum } from '@prisma/client';
import { z } from 'zod';

export const updateTemplateStatusSchema = z.object({
	id: z.string(),
	status: z.nativeEnum(ProjectStatusEnum)
});

export const deleteTemplateSchema = z.object({
	id: z.string()
});

export const requestChangesSchema = z.object({
	projectId: z.string(),
	feedback: z.string()
});
