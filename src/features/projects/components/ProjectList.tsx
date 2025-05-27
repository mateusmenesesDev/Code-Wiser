import { api } from '~/trpc/react';
import type {
	ProjectTemplateApiResponse,
	UserProjectApiResponse
} from '../types/Projects.type';
import { ProjectCard } from './ProjectCard';

type ProjectListProps = {
	projects: ProjectTemplateApiResponse[];
	userProjects: UserProjectApiResponse[];
	userCredits: number;
};

export default function ProjectList({
	projects,
	userCredits
}: ProjectListProps) {
	const myProjects = api.project.getEnrolled.useQuery();

	console.log('myProjects', myProjects);

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{projects.map((project) => (
				<ProjectCard
					status={project.status}
					key={project.id}
					projectTemplate={project}
					userCredits={userCredits}
					isEnrolled={myProjects.data?.some((p) => p.id === project.id)}
				/>
			))}
		</div>
	);
}
