import { describe, expect, it } from 'vitest';
import { buildLearningRecommendation } from './learningRecommendation';

const competency = {
	slug: 'testing',
	name: 'Testing',
	description: 'Use tests to protect behavior.',
	sortOrder: 1,
	reviewCategories: ['TESTS'],
	exerciseChallenges: [
		{
			id: 'challenge-1',
			title: 'Todo list tests',
			slug: 'todo-list',
			difficulty: 'EASY' as const,
			sortOrder: 0,
			isArchived: false,
			track: {
				name: 'React',
				slug: 'react',
				isPublished: true,
				isArchived: false
			},
			progressStatus: null
		}
	]
};

const matrix = [
	{
		slug: 'testing',
		name: 'Testing',
		description: 'Use tests to protect behavior.',
		state: 'NOT_EVALUATED' as const,
		evidence: [],
		mappedResources: {
			exercises: 1,
			learningOutcomes: 0,
			milestones: 0,
			reviewCategories: 1
		}
	}
];

const baseInput = {
	learningGoal: null,
	weeklyAvailabilityBand: null,
	interestedTechnologies: [],
	matrix,
	competencies: [competency],
	remediations: [],
	feedback: null,
	activity: { task: null, exercise: null, project: null }
};

describe('buildLearningRecommendation', () => {
	it('prioritizes an open remediation action', () => {
		const result = buildLearningRecommendation({
			...baseInput,
			remediations: [
				{
					title: 'Add integration tests',
					description: 'Cover the login flow.',
					status: 'OPEN',
					targetType: 'TASK',
					task: { id: 'task-1', projectId: 'project-1' },
					challenge: null,
					bookingId: null
				}
			]
		});

		expect(result).toMatchObject({
			kind: 'REMEDIATION',
			title: 'Add integration tests',
			href: '/workspace/project-1?taskId=task-1'
		});
	});

	it('uses recent review categories to choose a mapped challenge', () => {
		const result = buildLearningRecommendation({
			...baseInput,
			feedback: { categories: ['TESTS'], text: 'Add integration coverage.' },
			weeklyAvailabilityBand: 'UNDER_3'
		});

		expect(result).toMatchObject({
			kind: 'EXERCISE',
			title: 'Todo list tests',
			competency: { slug: 'testing' },
			reason: 'FEEDBACK',
			feedback: 'Add integration coverage.'
		});
	});

	it('falls back to the current activity when no mapped challenge is available', () => {
		const result = buildLearningRecommendation({
			...baseInput,
			competencies: [],
			matrix: [],
			activity: {
				task: null,
				exercise: {
					title: 'Counter',
					slug: 'counter',
					trackSlug: 'react'
				},
				project: null
			}
		});

		expect(result).toMatchObject({
			kind: 'EXERCISE',
			title: 'Counter',
			reason: 'CURRENT_ACTIVITY',
			href: '/exercises/react/counter'
		});
	});
});
