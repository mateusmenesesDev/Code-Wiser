import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Projects from '~/features/projects/components/Projects';
import { api } from '~/trpc/server';

export const metadata: Metadata = {
	title: 'Projects',
	description:
		'Discover hands-on projects designed to elevate your coding skills. From beginner-friendly tasks to advanced challenges, find the perfect software development project to accelerate your development journey.',
	openGraph: {
		title: 'Projects',
		description:
			'Discover hands-on projects designed to elevate your coding skills. From beginner-friendly tasks to advanced challenges, find the perfect software development project to accelerate your development journey.',
		type: 'website'
	}
};

export default async function Home() {
	const projects = await api.projectTemplate.getApproved();
	const { userId } = auth();
	const userProjects = userId ? await api.project.getEnrolled() : [];

	return (
		<main>
			<Projects
				initialProjectsData={projects}
				initialUserProjectsData={userProjects}
			/>
		</main>
	);
}
