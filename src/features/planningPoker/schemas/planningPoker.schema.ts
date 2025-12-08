import { z } from 'zod';

export const createSessionSchema = z.object({
	projectId: z.string(),
	taskIds: z.array(z.string()).min(1, 'At least one task must be selected')
});

export const joinSessionSchema = z.object({
	sessionId: z.string()
});

export const voteSchema = z.object({
	sessionId: z.string(),
	storyPoints: z
		.union([
			z.literal(1),
			z.literal(2),
			z.literal(3),
			z.literal(5),
			z.literal(8),
			z.literal(13),
			z.literal(21),
			z.null() // represents "?"
		])
		.optional()
});

export const changeVoteSchema = voteSchema;

// Fibonacci sequence values allowed for story points
const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 21] as const;

export const finalizeTaskSchema = z.object({
	sessionId: z.string(),
	finalStoryPoints: z
		.number()
		.int()
		.positive('Story points must be greater than 0')
		.refine(
			(value) =>
				FIBONACCI_VALUES.includes(value as (typeof FIBONACCI_VALUES)[number]),
			{
				message:
					'Story points must follow the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)'
			}
		)
		.optional()
});

export const endSessionSchema = z.object({
	sessionId: z.string()
});

export const getSessionSchema = z.object({
	sessionId: z.string()
});

export const getActiveSessionSchema = z.object({
	projectId: z.string()
});

export const getSessionVotesSchema = z.object({
	sessionId: z.string(),
	taskId: z.string()
});
