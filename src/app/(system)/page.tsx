import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Dashboard from '~/features/dashboard/components/Dashboard';
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
	const { userId } = auth();

	if (userId) {
		const dashboard = await api.dashboard.getOverview();
		return (
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-foreground">Your dashboard</h1>
					<p className="mt-2 text-muted-foreground">
						See what needs your attention and keep your learning moving.
					</p>
				</div>
				<Dashboard initialData={dashboard} />
			</main>
		);
	}

	const projects = await api.projectTemplate.getApproved();
	return (
		<main>
			<Projects initialProjectsData={projects} initialUserProjectsData={[]} />
		</main>
	);
}
