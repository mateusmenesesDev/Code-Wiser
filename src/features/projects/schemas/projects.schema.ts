import { ProjectDifficultyEnum, ProjectTypeEnum } from '@prisma/client';
import { z } from 'zod';
import { isRequired } from '~/features/schemas/utils';

export const projectSchema = z
	.object({
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
			.min(1),
		maxParticipants: z
			.number(isRequired('Maximum participants is required'))
			.min(1),
		credits: z
			.number(isRequired('Credits are required for credit-based projects'))
			.optional(),
		technologies: z
			.array(z.string(), isRequired('Technologies are required'))
			.min(1),
		learningOutcomes: z
			.array(
				z.object({ value: z.string() }),
				isRequired('Learning outcomes are required')
			)
			.min(1)
			.refine((data) => data.every((outcome) => outcome.value.trim() !== ''), {
				message: 'Learning outcomes cannot be empty'
			}),
		milestones: z
			.array(
				z.object({ value: z.string() }),
				isRequired('Milestones are required')
			)
			.min(1)
			.refine(
				(data) => data.every((milestone) => milestone.value.trim() !== ''),
				{
					message: 'Milestones cannot be empty'
				}
			),
		images: z
			.array(
				z.object({
					file: z.instanceof(File),
					preview: z.string()
				})
			)
			.optional(),
		timeline: z.string().optional()
	})
	.superRefine((data, ctx) => {
		if (data.type === ProjectTypeEnum.CREDITS && !data.credits) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Credits are required for credit-based projects',
				path: ['credits']
			});
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
