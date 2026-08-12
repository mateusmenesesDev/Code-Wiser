import { auth } from '@clerk/nextjs/server';
import Projects from '~/features/projects/components/Projects';
import { api } from '~/trpc/server';

export default async function ProjectsPage() {
	const projects = await api.projectTemplate.getApproved();
	const { userId } = auth();
	const userProjects = userId ? await api.project.getEnrolled() : [];

	return (
		<Projects
			initialProjectsData={projects}
			initialUserProjectsData={userProjects}
		/>
	);
}
