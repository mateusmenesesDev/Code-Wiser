import { describe, expect, it } from 'vitest';
import {
	createFeedbackInputSchema,
	feedbackStatusSchema,
	feedbackTypeSchema,
	listFeedbackInputSchema
} from './feedback.schema';

describe('feedback schemas', () => {
	it('accepts the planned feedback types', () => {
		expect(feedbackTypeSchema.options).toEqual([
			'BUG',
			'SUGGESTION',
			'QUESTION',
			'OTHER'
		]);
	});

	it('accepts the planned admin statuses', () => {
		expect(feedbackStatusSchema.options).toEqual([
			'OPEN',
			'IN_REVIEW',
			'RESOLVED',
			'DISMISSED'
		]);
	});

	it('validates a complete submission payload', () => {
		const result = createFeedbackInputSchema.safeParse({
			type: 'BUG',
			title: 'Workspace board freezes',
			description: 'Dragging a task freezes the board for a few seconds.',
			url: 'https://app.codewise.online/workspace/project-id',
			userAgent: 'Mozilla/5.0 Chrome/123',
			browser: 'Chrome',
			viewportWidth: 1440,
			viewportHeight: 900,
			screenshotUrl: 'https://utfs.io/f/example.png',
			screenshotKey: 'example.png'
		});

		expect(result.success).toBe(true);
	});

	it('defaults list pagination', () => {
		const result = listFeedbackInputSchema.parse({});

		expect(result).toMatchObject({ skip: 0, take: 50 });
	});
});
