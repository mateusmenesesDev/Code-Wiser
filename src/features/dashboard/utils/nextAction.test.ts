import { describe, expect, it } from 'vitest';
import { type DashboardOverview, getNextAction } from './nextAction';

const emptyOverview = (): DashboardOverview =>
	({
		urgentTask: null,
		projects: [],
		exercise: null,
		activeReview: null,
		latestDecision: null,
		booking: null,
		notifications: []
	}) as DashboardOverview;

describe('getNextAction', () => {
	it('prioritizes an open project task over other work', () => {
		const overview = emptyOverview();
		overview.urgentTask = {
			id: 'task-1',
			title: 'Fix the login form',
			status: 'IN_PROGRESS',
			priority: 'HIGH',
			dueDate: null,
			project: { id: 'project-1', title: 'Portal' }
		};
		overview.exercise = {
			status: 'CHANGES_REQUESTED',
			updatedAt: new Date(),
			challenge: {
				id: 'challenge-1',
				title: 'Counter',
				slug: 'counter',
				track: { name: 'React', slug: 'react' }
			}
		};

		expect(getNextAction(overview)).toMatchObject({
			title: 'Continue your most urgent task',
			href: '/workspace/project-1?taskId=task-1'
		});
	});

	it('promotes exercise feedback when no task needs attention', () => {
		const overview = emptyOverview();
		overview.exercise = {
			status: 'CHANGES_REQUESTED',
			updatedAt: new Date(),
			challenge: {
				id: 'challenge-1',
				title: 'Counter',
				slug: 'counter',
				track: { name: 'React', slug: 'react' }
			}
		};

		expect(getNextAction(overview)).toMatchObject({
			title: 'Address your exercise feedback',
			href: '/exercises/react/counter'
		});
	});

	it('falls back to browsing exercises for a new learner', () => {
		expect(getNextAction(emptyOverview())).toMatchObject({
			title: 'Choose your next challenge',
			href: '/exercises'
		});
	});
});
