export const PEER_REVIEW_CALIBRATION_VERSION = 1;
export const PEER_REVIEW_CALIBRATION_PASS_SCORE = 2;

export const peerReviewCalibrationCategories = [
	'CORRECTION',
	'SECURITY',
	'PERFORMANCE',
	'DESIGN',
	'TESTS',
	'READABILITY'
] as const;
export type PeerReviewCalibrationCategory =
	(typeof peerReviewCalibrationCategories)[number];

export const peerReviewCalibrationPromptIds = [
	'tests-missing-error-path',
	'security-unvalidated-input',
	'readability-duplicated-branch'
] as const;

export const peerReviewRubric = [
	{
		category: 'CORRECTION',
		title: 'Correctness',
		guidance:
			'Point out behavior that produces the wrong result for a realistic input.',
		usefulExample:
			'When the list is empty, this returns the previous page instead of an empty result. Handle that boundary case before calculating the offset.',
		avoidExample: 'This is wrong.'
	},
	{
		category: 'SECURITY',
		title: 'Security',
		guidance:
			'Call out a concrete path that can expose data, permissions, or trust boundaries.',
		usefulExample:
			'This endpoint accepts the project ID but does not check membership before returning its tasks. Verify access on the server before reading the project.',
		avoidExample: 'Security issue. Fix it.'
	},
	{
		category: 'PERFORMANCE',
		title: 'Performance',
		guidance:
			'Describe a measurable or likely cost caused by the change and where it matters.',
		usefulExample:
			'This query runs once per task in the loop, so a page of 50 tasks creates 51 database calls. Load the related rows in the page query instead.',
		avoidExample: 'This could be faster.'
	},
	{
		category: 'DESIGN',
		title: 'Design',
		guidance:
			'Identify a boundary or responsibility that makes the behavior hard to change safely.',
		usefulExample:
			'The route now decides both authorization and recommendation ranking. Keep the permission check at the server boundary and leave ranking in the recommendation module.',
		avoidExample: 'Bad architecture.'
	},
	{
		category: 'TESTS',
		title: 'Tests',
		guidance:
			'Name the important behavior or failure path that is not protected by a test.',
		usefulExample:
			'The success path is covered, but a rejected payment would leave the checkout pending. Add a test for the rejected response and persisted status.',
		avoidExample: 'Add more tests.'
	},
	{
		category: 'READABILITY',
		title: 'Readability',
		guidance:
			'Suggest a concrete change that makes the code easier to understand without prescribing style for its own sake.',
		usefulExample:
			'The two branches apply the same normalization with different names. Extract the shared value so the condition reads as the business distinction.',
		avoidExample: 'Refactor this for cleanliness.'
	}
] as const;

export const peerReviewChecklist = [
	'Name the file, behavior, or scenario you are discussing.',
	'Explain the impact instead of only stating that something is wrong.',
	'Suggest a concrete next step when one is reasonably clear.',
	'Keep the feedback about the work, not the person.',
	'Check whether the comment is useful before sending it.'
] as const;

export const peerReviewCalibrationPrompts = [
	{
		id: 'tests-missing-error-path',
		scenario:
			'A payment handler has a test for a successful charge, but no test verifies that a rejected charge changes the checkout to FAILED.',
		expectedCategory: 'TESTS'
	},
	{
		id: 'security-unvalidated-input',
		scenario:
			'An endpoint reads a projectId from the request and returns project tasks without checking whether the current user can access that project.',
		expectedCategory: 'SECURITY'
	},
	{
		id: 'readability-duplicated-branch',
		scenario:
			'Two branches repeat the same input normalization and differ only in which business action they choose afterward.',
		expectedCategory: 'READABILITY'
	}
] as const;
