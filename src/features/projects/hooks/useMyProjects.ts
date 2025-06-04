import { useMemo } from 'react';
import { api } from '~/trpc/react';
import type { UserProjectApiResponse } from '../types/Projects.type';
import { getLastActivityRelativeTime } from '../utils/projectUtils';

export interface ProjectWithProgress extends UserProjectApiResponse {
	progress: number;
	status: 'In Progress' | 'Near Completion' | 'Not Started';
	lastActivity: string;
}

export function useMyProjects() {
	const {
		data: projects,
		isLoading: isProjectsLoading,
		error
	} = api.project.getEnrolled.useQuery();

	const progressQueries = api.useQueries(
		(t) =>
			projects?.map((project) =>
				t.project.getProjectProgress({ projectId: project.id })
			) ?? []
	);

	const activityQueries = api.useQueries(
		(t) =>
			projects?.map((project) =>
				t.project.getLastActivityDay({ projectId: project.id })
			) ?? []
	);

	const isLoading =
		isProjectsLoading ||
		progressQueries.some((q) => q.isLoading) ||
		activityQueries.some((q) => q.isLoading);

	const projectsWithProgress = useMemo(() => {
		if (
			!projects ||
			progressQueries.some((q) => q.isLoading) ||
			activityQueries.some((q) => q.isLoading)
		) {
			return [];
		}

		return projects.map((project, index): ProjectWithProgress => {
			const progressData = progressQueries[index]?.data;
			const lastActivityData = activityQueries[index]?.data;

			const progress = progressData?.progress || 0;

			let status: ProjectWithProgress['status'] = 'Not Started';
			if (progress > 0 && progress < 80) {
				status = 'In Progress';
			} else if (progress >= 80) {
				status = 'Near Completion';
			}

			const lastActivity = lastActivityData
				? getLastActivityRelativeTime(lastActivityData)
				: 'No activity yet';

			return {
				...project,
				progress,
				status,
				lastActivity
			};
		});
	}, [projects, progressQueries, activityQueries]);

	return {
		projects: projectsWithProgress,
		isLoading,
		error
	};
}
