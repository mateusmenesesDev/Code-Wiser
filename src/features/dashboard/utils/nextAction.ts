import type { RouterOutputs } from '~/trpc/react';

export type DashboardOverview = RouterOutputs['dashboard']['getOverview'];

export type DashboardNextAction = {
	description: string;
	titleKey: string;
	labelKey: string;
	descriptionKey?: string;
	href: string;
};

export function getNextAction(
	overview: DashboardOverview
): DashboardNextAction | null {
	if (overview.urgentTask?.project) {
		return {
			description: overview.urgentTask.title,
			titleKey: 'urgentTitle',
			labelKey: 'openTask',
			href: `/workspace/${overview.urgentTask.project.id}?taskId=${overview.urgentTask.id}`
		};
	}

	if (
		overview.exercise &&
		(overview.exercise.status === 'IN_PROGRESS' ||
			overview.exercise.status === 'CHANGES_REQUESTED')
	) {
		return {
			description: overview.exercise.challenge.title,
			titleKey:
				overview.exercise.status === 'CHANGES_REQUESTED'
					? 'exerciseChangesTitle'
					: 'exerciseSubmitTitle',
			labelKey: 'openExercise',
			href: `/exercises/${overview.exercise.challenge.track.slug}/${overview.exercise.challenge.slug}`
		};
	}

	if (overview.activeReview?.status === 'CHANGES_REQUESTED') {
		return {
			description: overview.activeReview.task.title,
			titleKey: 'reviewChangesTitle',
			labelKey: 'openProject',
			href: overview.activeReview.task.project
				? `/workspace/${overview.activeReview.task.project.id}?taskId=${overview.activeReview.task.id}`
				: '/my-projects'
		};
	}

	const project = overview.projects[0];
	if (project) {
		return {
			description: project.title,
			titleKey: 'projectTitle',
			labelKey: 'openProject',
			href: `/workspace/${project.id}`
		};
	}

	return {
		description: 'Start with a hands-on exercise or project.',
		titleKey: 'emptyTitle',
		labelKey: 'browseExercises',
		descriptionKey: 'emptyDescription',
		href: '/exercises'
	};
}
