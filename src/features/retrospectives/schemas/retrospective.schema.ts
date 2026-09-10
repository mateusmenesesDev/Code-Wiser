import { RetrospectiveCategoryEnum } from '@prisma/client';
import { z } from 'zod';

export const createRetrospectiveSchema = z.object({
	projectId: z.string().min(1),
	sprintId: z.string().min(1)
});

export const addRetrospectiveItemSchema = z.object({
	retrospectiveId: z.string().min(1),
	category: z.nativeEnum(RetrospectiveCategoryEnum),
	content: z
		.string()
		.trim()
		.min(1, { message: 'Write a note before adding it' })
		.max(1000, { message: 'Notes must be 1000 characters or fewer' })
});

export const toggleRetrospectiveItemSchema = z.object({
	itemId: z.string().min(1),
	completed: z.boolean()
});

export const deleteRetrospectiveItemSchema = z.object({
	itemId: z.string().min(1)
});
