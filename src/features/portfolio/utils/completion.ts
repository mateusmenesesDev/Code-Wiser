export type PortfolioCompletionInput = {
	taskCount: number;
	incompleteTaskCount: number;
	milestoneCount: number;
	unreviewedMilestoneCount: number;
	pendingReviewCount: number;
	hasMentorEvaluation: boolean;
};

export type PortfolioCompletion = {
	isComplete: boolean;
	completedCriteria: number;
	totalCriteria: number;
	criteria: {
		key:
			| 'hasTasks'
			| 'allTasksDone'
			| 'milestonesReviewed'
			| 'reviewsResolved'
			| 'mentorEvaluation';
		complete: boolean;
	}[];
};

export function getPortfolioCompletion(
	input: PortfolioCompletionInput
): PortfolioCompletion {
	const criteria = [
		{ key: 'hasTasks' as const, complete: input.taskCount > 0 },
		{
			key: 'allTasksDone' as const,
			complete: input.taskCount > 0 && input.incompleteTaskCount === 0
		},
		{
			key: 'milestonesReviewed' as const,
			complete:
				input.milestoneCount === 0 || input.unreviewedMilestoneCount === 0
		},
		{
			key: 'reviewsResolved' as const,
			complete: input.pendingReviewCount === 0
		},
		{ key: 'mentorEvaluation' as const, complete: input.hasMentorEvaluation }
	];

	const completedCriteria = criteria.filter(
		(criterion) => criterion.complete
	).length;

	return {
		isComplete: completedCriteria === criteria.length,
		completedCriteria,
		totalCriteria: criteria.length,
		criteria
	};
}
