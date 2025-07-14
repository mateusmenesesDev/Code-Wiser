import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum,
	ProjectStatusEnum
} from '@prisma/client';
import { z } from 'zod';

export const updateTemplateStatusSchema = z.object({
	id: z.string(),
	status: z.nativeEnum(ProjectStatusEnum)
});

export const deleteTemplateSchema = z.object({
	id: z.string()
});

const baseTemplateSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	category: z.string().min(1, 'Category is required'),
	difficulty: z.nativeEnum(ProjectDifficultyEnum),
	accessType: z.nativeEnum(ProjectAccessTypeEnum),
	technologies: z
		.array(z.string())
		.min(1, 'At least one technology is required'),
	figmaProjectUrl: z.string().url().optional().or(z.literal('')),
	minParticipants: z.number().min(1).default(1),
	maxParticipants: z.number().min(1).default(4),
	credits: z.number().min(0).optional(),
	expectedDuration: z.string().optional(),
	methodology: z
		.nativeEnum(ProjectMethodologyEnum)
		.default(ProjectMethodologyEnum.SCRUM),
	milestones: z.array(z.string()).optional(),
	learningOutcomes: z.array(z.string()).optional(),
	preRequisites: z.array(z.string()).optional(),
	demoUrl: z.string().optional(),
	images: z
		.array(
			z.object({
				url: z.string(),
				alt: z.string().optional(),
				order: z.number().optional()
			})
		)
		.optional()
});

export const createProjectTemplateSchema = baseTemplateSchema
	.refine(
		(data) => {
			if (
				data.accessType === ProjectAccessTypeEnum.CREDITS &&
				(!data.credits || data.credits <= 0)
			) {
				return false;
			}
			return true;
		},
		{
			message: 'Credits are required for credit-based projects',
			path: ['credits']
		}
	)
	.refine(
		(data) => {
			return data.minParticipants <= data.maxParticipants;
		},
		{
			message:
				'Minimum participants cannot be greater than maximum participants',
			path: ['maxParticipants']
		}
	);

export const updateTemplateBasicInfoInputSchema = baseTemplateSchema
	.extend({
		id: z.string()
	})
	.partial()
	.refine(
		(data) => {
			if (!data.accessType) return true;
			if (
				data.accessType === ProjectAccessTypeEnum.CREDITS &&
				(!data.credits || data.credits <= 0)
			) {
				return false;
			}
			return true;
		},
		{
			message: 'Credits are required for credit-based projects',
			path: ['credits']
		}
	)
	.refine(
		(data) => {
			if (!data.minParticipants || !data.maxParticipants) return true;
			return data.minParticipants <= data.maxParticipants;
		},
		{
			message:
				'Minimum participants cannot be greater than maximum participants',
			path: ['maxParticipants']
		}
	);
