import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Projects from '~/features/projects/components/Projects';
import { api } from '~/trpc/server';

export const metadata: Metadata = {
	title: 'Software Development Projects | Learn by Building Real Applications',
	description:
		'Browse our curated collection of real-world software development projects. From web development to cloud computing, find hands-on projects that match your skill level and career goals. Get expert guidance and practical experience.',
	openGraph: {
		title:
			'Software Development Projects | Learn by Building Real Applications',
		description:
			'Browse our curated collection of real-world software development projects. From web development to cloud computing, find hands-on projects that match your skill level and career goals. Get expert guidance and practical experience.',
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
