import { ProjectMethodologyEnum } from '@prisma/client';
import { z } from 'zod';

export const createProjectSchema = z.object({
	projectTemplateId: z.string()
});

export const updateProjectSchema = z.object({
	id: z.string(),
	title: z.string().min(1).optional(),
	description: z.string().optional(),
	methodology: z.nativeEnum(ProjectMethodologyEnum).optional()
});
