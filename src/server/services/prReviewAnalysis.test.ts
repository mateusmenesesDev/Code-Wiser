import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';

vi.mock('~/env', () => ({
	env: { GROQ_API_KEY: undefined }
}));

import { processQueuedPRReviewAnalyses } from './prReviewAnalysis';

describe('PR review analysis worker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('claims one job and requeues the first bounded failure for retry', async () => {
		mockDb.prReviewAnalysis.findFirst
			.mockResolvedValueOnce({
				id: 'analysis-1',
				reviewId: 'review-1',
				sourceHeadSha: 'head-1'
			} as never)
			.mockResolvedValue(null);
		mockDb.prReviewAnalysis.updateMany
			.mockResolvedValueOnce({ count: 0 })
			.mockResolvedValueOnce({ count: 0 })
			.mockResolvedValueOnce({ count: 1 });
		mockDb.prReviewAnalysis.findUnique.mockResolvedValue({
			id: 'analysis-1',
			reviewId: 'review-1',
			sourceHeadSha: 'head-1',
			attempts: 1
		} as never);
		mockDb.prReviewAnalysis.update.mockResolvedValue({} as never);

		await expect(processQueuedPRReviewAnalyses(mockDb)).resolves.toEqual({
			processed: 1,
			completed: 0,
			failed: 1
		});
		expect(mockDb.prReviewAnalysis.updateMany).toHaveBeenCalledTimes(3);
		expect(mockDb.prReviewAnalysis.update).toHaveBeenCalledWith({
			where: { id: 'analysis-1' },
			data: expect.objectContaining({
				status: 'QUEUED',
				errorCode: 'AI_NOT_CONFIGURED'
			})
		});
	});
});
