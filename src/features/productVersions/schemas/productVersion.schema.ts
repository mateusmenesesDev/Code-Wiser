import { z } from 'zod';

const versionFields = {
	name: z.string().trim().min(1, 'Version name is required').max(100),
	description: z.string().trim().max(1000).optional()
};

export const createProductVersionSchema = z.object({
	projectId: z.string().min(1),
	isTemplate: z.boolean(),
	...versionFields
});

export const updateProductVersionSchema = z.object({
	id: z.string().min(1),
	...versionFields
});

export const reorderProductVersionsSchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().min(1),
				order: z.number().int().min(0)
			})
		)
		.min(1)
});

export const updateStoryAssignmentsSchema = z.object({
	projectId: z.string().min(1),
	isTemplate: z.boolean(),
	updates: z
		.array(
			z.object({
				taskId: z.string().min(1),
				versionId: z.string().min(1).nullable(),
				order: z.number().int().min(0).default(0)
			})
		)
		.min(1)
});
