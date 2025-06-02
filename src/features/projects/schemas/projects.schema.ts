import { ProjectDifficultyEnum, ProjectTypeEnum } from '@prisma/client';
import { z } from 'zod';
import { isRequired } from '~/features/schemas/utils';

const baseProjectTemplateSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	category: z.string(isRequired('Category is required')).min(1),
	type: z.nativeEnum(ProjectTypeEnum, isRequired('Project type is required')),
	difficulty: z.nativeEnum(
		ProjectDifficultyEnum,
		isRequired('Difficulty is required')
	),
	minParticipants: z
		.number(isRequired('Minimum participants is required'))
		.min(1)
		.nonnegative(),
	maxParticipants: z
		.number(isRequired('Maximum participants is required'))
		.min(1)
		.nonnegative(),
	credits: z.number().optional(),
	technologies: z
		.array(z.string(), isRequired('Technologies are required'))
		.min(1)
});

export const createProjectTemplateSchema = baseProjectTemplateSchema
	.extend({
		expectedDuration: z.string().optional(),
		images: z
			.array(
				z.object({
					file: z.instanceof(File),
					preview: z.string()
				})
			)
			.optional()
	})
	.superRefine((data, ctx) => {
		if (data.type === ProjectTypeEnum.CREDITS) {
			if (!data.credits || data.credits <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Credits are required for credit-based projects',
					path: ['credits']
				});
			}
		}
		if (data.minParticipants > data.maxParticipants) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'Minimum participants cannot be greater than maximum participants',
				path: ['maxParticipants']
			});
		}
	});

export const createProjectSchema = z.object({
	projectTemplateId: z.string()
});
