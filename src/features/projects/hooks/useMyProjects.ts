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
		isLoading,
		error
	} = api.project.getEnrolled.useQuery();

	const projectsWithProgress = useMemo(() => {
		if (!projects) {
			return [];
		}

		return projects.map((project): ProjectWithProgress => {
			const progress = project.progress ?? 0;

			let status: ProjectWithProgress['status'] = 'Not Started';
			if (progress > 0 && progress < 80) {
				status = 'In Progress';
			} else if (progress >= 80) {
				status = 'Near Completion';
			}

			const lastActivity = project.lastActivityAt
				? getLastActivityRelativeTime(project.lastActivityAt)
				: 'No activity yet';

			return {
				...project,
				progress,
				status,
				lastActivity
			};
		});
	}, [projects]);

	const isEnrolledProject = (projectTitle: string) => {
		const enrolledProjects = projectsWithProgress.find(
			(project) => project.title === projectTitle
		);
		if (enrolledProjects) {
			return enrolledProjects.id;
		}
		return false;
	};

	return {
		projects: projectsWithProgress,
		isLoading,
		isProjectsLoading: isLoading,
		error,
		isEnrolledProject
	};
}
