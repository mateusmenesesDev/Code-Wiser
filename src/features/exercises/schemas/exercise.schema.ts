import {
	ExerciseChallengeDifficulty,
	ExerciseReviewDecisionStatus
} from '@prisma/client';
import { z } from 'zod';
import { slugSchemaRegex } from '../lib/slugify';

const githubRepoUrlSchema = z
	.string()
	.trim()
	.refine(
		(value) =>
			value === '' ||
			/^https:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(value),
		{ message: 'Repository URL must be a valid GitHub repository URL' }
	);

export const createExerciseTrackSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	description: z.string().trim().min(1, 'Description is required'),
	repoUrl: githubRepoUrlSchema.default(''),
	slug: z
		.string()
		.trim()
		.regex(slugSchemaRegex, 'Slug must be kebab-case')
		.optional(),
	sortOrder: z.number().int().min(0).optional(),
	isPublished: z.boolean().optional()
});

export const updateExerciseTrackSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).optional(),
	description: z.string().trim().min(1).optional(),
	repoUrl: githubRepoUrlSchema.optional(),
	slug: z
		.string()
		.trim()
		.regex(slugSchemaRegex, 'Slug must be kebab-case')
		.optional(),
	sortOrder: z.number().int().min(0).optional(),
	isPublished: z.boolean().optional(),
	isArchived: z.boolean().optional()
});

export const exerciseTrackIdSchema = z.object({
	id: z.string().uuid()
});

export const exerciseChallengeIdSchema = z.object({
	id: z.string().uuid()
});

export const exerciseTrackSlugSchema = z.object({
	slug: z.string().trim().min(1)
});

export const createExerciseChallengeSchema = z.object({
	trackId: z.string().uuid(),
	title: z.string().trim().min(1, 'Title is required'),
	difficulty: z.nativeEnum(ExerciseChallengeDifficulty),
	description: z.string().trim().min(1, 'Description is required'),
	setupInstructions: z.string().trim().min(1, 'Setup instructions are required'),
	acceptanceCriteria: z
		.string()
		.trim()
		.min(1, 'Acceptance criteria are required'),
	slug: z
		.string()
		.trim()
		.regex(slugSchemaRegex, 'Slug must be kebab-case')
		.optional(),
	sortOrder: z.number().int().min(0).optional()
});

export const updateExerciseChallengeSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).optional(),
	difficulty: z.nativeEnum(ExerciseChallengeDifficulty).optional(),
	description: z.string().trim().min(1).optional(),
	setupInstructions: z.string().trim().min(1).optional(),
	acceptanceCriteria: z.string().trim().min(1).optional(),
	slug: z
		.string()
		.trim()
		.regex(slugSchemaRegex, 'Slug must be kebab-case')
		.optional(),
	sortOrder: z.number().int().min(0).optional(),
	isArchived: z.boolean().optional()
});

export const reorderExerciseChallengesSchema = z.object({
	trackId: z.string().uuid(),
	difficulty: z.nativeEnum(ExerciseChallengeDifficulty),
	orderedChallengeIds: z.array(z.string().uuid()).min(1)
});

export const exerciseChallengeSlugSchema = z.object({
	trackSlug: z.string().trim().min(1),
	challengeSlug: z.string().trim().min(1)
});

export const githubPullRequestUrlSchema = z
	.string()
	.trim()
	.transform((value) => {
		try {
			const url = new URL(value);
			const match = url.pathname.match(
				/^\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)(?:\/.*)?$/
			);
			if (
				!match ||
				(url.hostname !== 'github.com' && url.hostname !== 'www.github.com')
			) {
				return value;
			}
			return `https://github.com/${match[1]}/${match[2]}/pull/${match[3]}`;
		} catch {
			return value;
		}
	})
	.refine(
		(value) =>
			/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/.test(value),
		{ message: 'PR URL must be a valid GitHub pull request URL' }
	);

export function githubRepoPathFromUrl(repoUrl: string): string | null {
	try {
		const url = new URL(repoUrl.trim());
		const match = url.pathname.match(/^\/([\w.-]+)\/([\w.-]+)\/?$/);
		if (
			!match ||
			(url.hostname !== 'github.com' && url.hostname !== 'www.github.com')
		) {
			return null;
		}
		return `${match[1]}/${match[2]}`.toLowerCase();
	} catch {
		return null;
	}
}

export function githubRepoPathFromPullRequestUrl(prUrl: string): string | null {
	try {
		const url = new URL(prUrl.trim());
		const match = url.pathname.match(/^\/([\w.-]+)\/([\w.-]+)\/pull\/\d+$/);
		if (
			!match ||
			(url.hostname !== 'github.com' && url.hostname !== 'www.github.com')
		) {
			return null;
		}
		return `${match[1]}/${match[2]}`.toLowerCase();
	} catch {
		return null;
	}
}

export const requestExerciseReviewSchema = z.object({
	trackId: z.string().uuid(),
	prUrl: githubPullRequestUrlSchema,
	challengeIds: z.array(z.string().uuid()).min(1, 'Select at least one challenge')
});

export const exerciseReviewSubmissionIdSchema = z.object({
	id: z.string().uuid()
});

export const decideExerciseReviewSchema = z.object({
	decisionId: z.string().uuid(),
	status: z.enum([
		ExerciseReviewDecisionStatus.APPROVED,
		ExerciseReviewDecisionStatus.CHANGES_REQUESTED
	]),
	mentorComment: z.string().trim().max(5000).optional()
});

export const notifyExercisePrUpdatedSchema = z.object({
	submissionId: z.string().uuid(),
	updateNote: z.string().trim().max(2000).optional()
});
