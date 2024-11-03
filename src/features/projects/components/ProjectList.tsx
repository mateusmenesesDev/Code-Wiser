import type {
	ProjectApiResponse,
	UserProjectApiResponse
} from '../types/Projects.type';
import { ProjectCard } from './ProjectCard';

type ProjectListProps = {
	projects: ProjectApiResponse[];
	userProjects: UserProjectApiResponse[];
	userCredits: number;
};

export default function ProjectList({
	projects,
	userProjects,
	userCredits
}: ProjectListProps) {
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{projects.map((project) => (
				<ProjectCard
					status={
						userProjects?.find((up) => up.projectId === project.id)?.status
					}
					key={project.id}
					project={project}
					userCredits={userCredits}
				/>
			))}
		</div>
	);
}
