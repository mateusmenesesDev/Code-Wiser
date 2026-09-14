import type { CompetencyLearningContext } from '~/server/services/competency/competencyMatrix';
import type { CompetencyMatrixEntry } from './competencyMatrix';

export type LearningRecommendation = {
	kind: 'REMEDIATION' | 'EXERCISE' | 'PROJECT';
	title: string;
	description: string;
	href: string;
	competency: { slug: string; name: string } | null;
	reason: 'FEEDBACK' | 'GOAL' | 'CURRENT_ACTIVITY' | 'BASELINE' | 'REMEDIATION';
	feedback: string | null;
	availabilityBand: string | null;
};

type RecommendationRemediation = {
	title: string;
	description: string;
	status: string;
	targetType: string;
	task: { id: string; projectId: string | null } | null;
	challenge: { slug: string; track: { slug: string } } | null;
	bookingId: string | null;
};

type RecommendationFeedback = {
	categories: string[];
	text: string | null;
};

type RecommendationActivity = {
	task: { id: string; title: string; projectId: string } | null;
	exercise: {
		title: string;
		slug: string;
		trackSlug: string;
	} | null;
	project: { id: string; title: string } | null;
};

type RecommendationInput = {
	learningGoal: string | null;
	weeklyAvailabilityBand: string | null;
	interestedTechnologies: string[];
	matrix: CompetencyMatrixEntry[];
	competencies: CompetencyLearningContext['competencies'];
	remediations: RecommendationRemediation[];
	feedback: RecommendationFeedback | null;
	activity: RecommendationActivity;
};

const goalPriority: Record<string, string[]> = {
	GET_FIRST_JOB: [
		'javascript-typescript',
		'testing',
		'git-collaboration',
		'ui-accessibility'
	],
	GROW_IN_CURRENT_ROLE: ['architecture', 'data-modeling', 'testing'],
	CHANGE_SPECIALTY: ['javascript-typescript', 'architecture', 'data-modeling'],
	BUILD_PORTFOLIO: ['ui-accessibility', 'architecture', 'testing'],
	PREPARE_FOR_INTERVIEWS: ['javascript-typescript', 'data-modeling', 'testing'],
	EXPLORE_DEVELOPMENT: ['javascript-typescript', 'ui-accessibility']
};

const difficultyOrder: Record<string, number> = {
	EASY: 0,
	MEDIUM: 1,
	HARD: 2
};

const availabilityDifficultyOrder: Record<string, string[]> = {
	UNDER_3: ['EASY', 'MEDIUM', 'HARD'],
	FROM_4_TO_7: ['EASY', 'MEDIUM', 'HARD'],
	FROM_8_TO_12: ['MEDIUM', 'EASY', 'HARD'],
	OVER_12: ['HARD', 'MEDIUM', 'EASY']
};

const remediationStatusOrder: Record<string, number> = {
	OPEN: 0,
	IN_PROGRESS: 1,
	SUBMITTED: 2
};

function actionHref(action: RecommendationRemediation) {
	if (action.targetType === 'TASK' && action.task?.projectId) {
		return `/workspace/${action.task.projectId}?taskId=${action.task.id}`;
	}
	if (action.targetType === 'EXERCISE' && action.challenge) {
		return `/exercises/${action.challenge.track.slug}/${action.challenge.slug}`;
	}
	return action.targetType === 'MENTORSHIP' ? '/mentorship' : '/';
}

function scoreCompetency(
	competency: CompetencyLearningContext['competencies'][number],
	goal: string | null,
	technologies: string[],
	feedbackCategories: Set<string>
) {
	const priority = goal ? (goalPriority[goal] ?? []) : [];
	const goalIndex = priority.indexOf(competency.slug);
	const hasFeedback = competency.reviewCategories.some((category) =>
		feedbackCategories.has(category)
	);
	const hasTechnology = competency.exerciseChallenges.some((challenge) =>
		technologies.some((technology) =>
			`${challenge.track.name} ${challenge.track.slug}`
				.toLowerCase()
				.includes(technology.toLowerCase().replace('_', '-'))
		)
	);

	return {
		competency,
		score:
			(hasFeedback ? 1000 : 0) +
			(goalIndex >= 0 ? 500 - goalIndex : 0) +
			(hasTechnology ? 100 : 0) -
			competency.sortOrder
	};
}

function chooseChallenge(
	competency: CompetencyLearningContext['competencies'][number],
	availabilityBand: string | null
) {
	const difficultyOrderForBand =
		availabilityDifficultyOrder[availabilityBand ?? ''] ??
		Object.entries(difficultyOrder)
			.sort(([, left], [, right]) => left - right)
			.map(([difficulty]) => difficulty);

	return competency.exerciseChallenges
		.filter(
			(challenge) =>
				!challenge.isArchived &&
				challenge.track.isPublished &&
				!challenge.track.isArchived &&
				(!challenge.progressStatus ||
					challenge.progressStatus === 'NOT_STARTED')
		)
		.sort((left, right) => {
			const difficultyDiff =
				difficultyOrderForBand.indexOf(left.difficulty) -
				difficultyOrderForBand.indexOf(right.difficulty);
			return difficultyDiff || left.sortOrder - right.sortOrder;
		})[0];
}

export function buildLearningRecommendation({
	learningGoal,
	weeklyAvailabilityBand,
	interestedTechnologies,
	matrix,
	competencies,
	remediations,
	feedback,
	activity
}: RecommendationInput): LearningRecommendation | null {
	const remediation = [...remediations].sort(
		(left, right) =>
			(remediationStatusOrder[left.status] ?? 99) -
			(remediationStatusOrder[right.status] ?? 99)
	)[0];
	if (remediation) {
		return {
			kind: 'REMEDIATION',
			title: remediation.title,
			description: remediation.description,
			href: actionHref(remediation),
			competency: null,
			reason: 'REMEDIATION',
			feedback: null,
			availabilityBand: weeklyAvailabilityBand
		};
	}

	const feedbackCategories = new Set(feedback?.categories ?? []);
	const candidates = competencies
		.map((competency) =>
			scoreCompetency(
				competency,
				learningGoal,
				interestedTechnologies,
				feedbackCategories
			)
		)
		.filter(({ competency }) => {
			const entry = matrix.find((item) => item.slug === competency.slug);
			return entry?.state !== 'DEMONSTRATED';
		})
		.sort((left, right) => right.score - left.score);

	const best = candidates[0];
	if (best) {
		const challenge = chooseChallenge(best.competency, weeklyAvailabilityBand);
		if (challenge) {
			return {
				kind: 'EXERCISE',
				title: challenge.title,
				description: best.competency.description,
				href: `/exercises/${challenge.track.slug}/${challenge.slug}`,
				competency: {
					slug: best.competency.slug,
					name: best.competency.name
				},
				reason: best.competency.reviewCategories.some((category) =>
					feedbackCategories.has(category)
				)
					? 'FEEDBACK'
					: learningGoal
						? 'GOAL'
						: 'BASELINE',
				feedback: feedback?.text?.trim().slice(0, 180) ?? null,
				availabilityBand: weeklyAvailabilityBand
			};
		}
	}

	if (activity.exercise) {
		return {
			kind: 'EXERCISE',
			title: activity.exercise.title,
			description: 'Continue the exercise already in progress.',
			href: `/exercises/${activity.exercise.trackSlug}/${activity.exercise.slug}`,
			competency: null,
			reason: 'CURRENT_ACTIVITY',
			feedback: null,
			availabilityBand: weeklyAvailabilityBand
		};
	}

	if (activity.task) {
		return {
			kind: 'PROJECT',
			title: activity.task.title,
			description: 'Continue the task already in progress.',
			href: `/workspace/${activity.task.projectId}?taskId=${activity.task.id}`,
			competency: null,
			reason: 'CURRENT_ACTIVITY',
			feedback: null,
			availabilityBand: weeklyAvailabilityBand
		};
	}

	if (activity.project) {
		return {
			kind: 'PROJECT',
			title: activity.project.title,
			description: 'Continue your current learning project.',
			href: `/workspace/${activity.project.id}`,
			competency: null,
			reason: 'CURRENT_ACTIVITY',
			feedback: null,
			availabilityBand: weeklyAvailabilityBand
		};
	}

	return null;
}
