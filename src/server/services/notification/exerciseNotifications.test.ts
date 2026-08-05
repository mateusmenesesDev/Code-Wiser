import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';

vi.mock('~/server/utils/getBaseUrl', () => ({
	getBaseUrl: () => 'https://app.example.com'
}));

vi.mock('./base', () => ({
	createNotification: vi.fn(),
	getAdminUsers: vi.fn()
}));

import { createNotification, getAdminUsers } from './base';
import {
	notifyExerciseChallengeResponse,
	notifyExercisePrUpdated,
	notifyExerciseReviewRequested
} from './exerciseNotifications';

describe('exerciseNotifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('notifies all admins when an exercise review is requested', async () => {
		vi.mocked(getAdminUsers).mockResolvedValue([
			{ id: 'admin-1', email: 'a@example.com', name: 'Admin' },
			{ id: 'admin-2', email: 'b@example.com', name: 'Other' }
		]);

		await notifyExerciseReviewRequested({
			db: mockDb as never,
			memberName: 'Ada',
			submissionId: '55555555-5555-5555-5555-555555555555',
			trackName: 'React',
			challengeTitles: ['Counter', 'Todo'],
			prUrl: 'https://github.com/org/repo/pull/1'
		});

		expect(createNotification).toHaveBeenCalledTimes(2);
		expect(createNotification).toHaveBeenCalledWith({
			db: mockDb,
			userId: 'admin-1',
			type: 'EXERCISE_REVIEW_REQUESTED',
			title: 'Exercise Review Requested',
			message:
				'Ada requested review for Counter, Todo in "React"',
			link: 'https://app.example.com/admin/exercise-reviews/55555555-5555-5555-5555-555555555555'
		});
	});

	it('notifies admins when a mentee marks a PR as updated', async () => {
		vi.mocked(getAdminUsers).mockResolvedValue([
			{ id: 'admin-1', email: 'a@example.com', name: 'Admin' }
		]);

		await notifyExercisePrUpdated({
			db: mockDb as never,
			memberName: 'Ada',
			submissionId: '55555555-5555-5555-5555-555555555555',
			trackName: 'React',
			challengeTitles: ['Todo'],
			updateNote: 'Fixed failing tests'
		});

		expect(createNotification).toHaveBeenCalledWith({
			db: mockDb,
			userId: 'admin-1',
			type: 'EXERCISE_PR_UPDATED',
			title: 'Exercise PR Updated',
			message:
				'Ada updated the PR for Todo in "React". Note: Fixed failing tests',
			link: 'https://app.example.com/admin/exercise-reviews/55555555-5555-5555-5555-555555555555'
		});
	});

	it('notifies the mentee when a challenge is approved', async () => {
		await notifyExerciseChallengeResponse({
			db: mockDb as never,
			memberId: 'user-1',
			mentorName: 'Mentor',
			challengeTitle: 'Counter',
			trackSlug: 'react',
			challengeSlug: 'counter',
			status: 'APPROVED',
			mentorComment: 'Great job'
		});

		expect(createNotification).toHaveBeenCalledWith({
			db: mockDb,
			userId: 'user-1',
			type: 'EXERCISE_CHALLENGE_APPROVED',
			title: 'Exercise Challenge Approved',
			message: 'Mentor approved your exercise challenge "Counter"',
			link: 'https://app.example.com/exercises/react/counter'
		});
	});

	it('notifies the mentee when changes are requested', async () => {
		await notifyExerciseChallengeResponse({
			db: mockDb as never,
			memberId: 'user-1',
			mentorName: null,
			challengeTitle: 'Counter',
			trackSlug: 'react',
			challengeSlug: 'counter',
			status: 'CHANGES_REQUESTED'
		});

		expect(createNotification).toHaveBeenCalledWith({
			db: mockDb,
			userId: 'user-1',
			type: 'EXERCISE_CHANGES_REQUESTED',
			title: 'Exercise Changes Requested',
			message:
				'Your mentor requested changes on your exercise challenge "Counter"',
			link: 'https://app.example.com/exercises/react/counter'
		});
	});
});
