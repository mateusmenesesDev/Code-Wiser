import { describe, expect, it } from 'vitest';
import { getPortfolioCompletion } from './completion';

describe('getPortfolioCompletion', () => {
	it('requires explicit evidence for the completion badge', () => {
		expect(
			getPortfolioCompletion({
				taskCount: 2,
				incompleteTaskCount: 0,
				milestoneCount: 1,
				unreviewedMilestoneCount: 0,
				pendingReviewCount: 0,
				hasMentorEvaluation: true
			}).isComplete
		).toBe(true);

		expect(
			getPortfolioCompletion({
				taskCount: 2,
				incompleteTaskCount: 1,
				milestoneCount: 1,
				unreviewedMilestoneCount: 0,
				pendingReviewCount: 0,
				hasMentorEvaluation: true
			}).isComplete
		).toBe(false);
	});

	it('does not treat an empty project as complete', () => {
		const result = getPortfolioCompletion({
			taskCount: 0,
			incompleteTaskCount: 0,
			milestoneCount: 0,
			unreviewedMilestoneCount: 0,
			pendingReviewCount: 0,
			hasMentorEvaluation: false
		});

		expect(result.completedCriteria).toBe(2);
		expect(result.isComplete).toBe(false);
	});
});
