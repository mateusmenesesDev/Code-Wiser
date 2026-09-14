import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { processMentorAttentionReminders } from './mentorAttentionReminders';
import { completeMentorAttention } from './mentorAttention.service';

const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('~/server/services/notification/base', () => ({
	createNotification: createNotificationMock
}));

describe('processMentorAttentionReminders', () => {
	beforeEach(() => {
		createNotificationMock.mockReset();
		mockDb.pullRequestReview.findMany.mockResolvedValue([
			{
				id: 'pr-1',
				createdAt: new Date('2026-08-11T08:00:00.000Z'),
				requestedBy: { name: 'Ada', email: 'ada@example.com' },
				task: {
					id: 'task-1',
					title: 'Build parser',
					project: { id: 'project-1', title: 'Compiler' }
				}
			}
		] as never);
		mockDb.exerciseReviewSubmission.findMany.mockResolvedValue([]);
		mockDb.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as never);
		mockDb.mentorAttentionAssignment.updateMany.mockResolvedValue({ count: 0 });
	});

	it('escalates overdue reviews to admins once per day', async () => {
		const result = await processMentorAttentionReminders(
			mockDb,
			new Date('2026-08-13T08:00:00.000Z')
		);

		expect(result).toEqual({ reviews: 1, created: 1, failures: 0 });
		expect(mockDb.mentorAttentionAssignment.updateMany).toHaveBeenCalledWith({
			where: {
				sourceType: 'PR_REVIEW',
				sourceId: 'pr-1',
				escalatedAt: null
			},
			data: { escalatedAt: new Date('2026-08-13T08:00:00.000Z') }
		});
		expect(createNotificationMock).toHaveBeenCalledWith({
			db: mockDb,
			userId: 'admin-1',
			type: 'MENTOR_REVIEW_OVERDUE',
			title: 'Overdue mentor review',
			message: 'Build parser for Ada has exceeded the 48-hour review SLA.',
			link: '/workspace/project-1?taskId=task-1',
			dedupeKey: 'mentor-review-overdue:PR_REVIEW:pr-1:2026-08-13'
		});
	});

	it('records completion latency for a claimed item', async () => {
		mockDb.mentorAttentionAssignment.findUnique.mockResolvedValue({
			id: 'assignment-1',
			sourceCreatedAt: new Date('2026-08-13T08:00:00.000Z'),
			completedAt: null
		} as never);
		mockDb.mentorAttentionAssignment.update.mockResolvedValue({} as never);

		await expect(
			completeMentorAttention(
				mockDb,
				'PR_REVIEW',
				'pr-1',
				'admin-1',
				new Date('2026-08-13T14:00:00.000Z')
			)
		).resolves.toBe(true);
		expect(mockDb.mentorAttentionAssignment.update).toHaveBeenCalledWith({
			where: { id: 'assignment-1' },
			data: {
				completedAt: new Date('2026-08-13T14:00:00.000Z'),
				completionMinutes: 360,
				completedById: 'admin-1'
			}
		});
	});
});
