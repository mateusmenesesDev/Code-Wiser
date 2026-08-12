import type { RouterOutputs } from '~/trpc/react';

export type DashboardOverview = RouterOutputs['dashboard']['getOverview'];

export type DashboardNextAction = {
	title: string;
	description: string;
	label: string;
	href: string;
};

export function getNextAction(
	overview: DashboardOverview
): DashboardNextAction | null {
	if (overview.urgentTask?.project) {
		return {
			title: 'Continue your most urgent task',
			description: overview.urgentTask.title,
			label: 'Open task',
			href: `/workspace/${overview.urgentTask.project.id}?taskId=${overview.urgentTask.id}`
		};
	}

	if (
		overview.exercise &&
		(overview.exercise.status === 'IN_PROGRESS' ||
			overview.exercise.status === 'CHANGES_REQUESTED')
	) {
		return {
			title:
				overview.exercise.status === 'CHANGES_REQUESTED'
					? 'Address your exercise feedback'
					: 'Submit your exercise for review',
			description: overview.exercise.challenge.title,
			label: 'Open exercise',
			href: `/exercises/${overview.exercise.challenge.track.slug}/${overview.exercise.challenge.slug}`
		};
	}

	if (overview.activeReview?.status === 'CHANGES_REQUESTED') {
		return {
			title: 'Update your pull request',
			description: overview.activeReview.task.title,
			label: 'Open project',
			href: overview.activeReview.task.project
				? `/workspace/${overview.activeReview.task.project.id}?taskId=${overview.activeReview.task.id}`
				: '/my-projects'
		};
	}

	const project = overview.projects[0];
	if (project) {
		return {
			title: 'Continue your learning project',
			description: project.title,
			label: 'Open project',
			href: `/workspace/${project.id}`
		};
	}

	return {
		title: 'Choose your next challenge',
		description: 'Start with a hands-on exercise or project.',
		label: 'Browse exercises',
		href: '/exercises'
	};
}
