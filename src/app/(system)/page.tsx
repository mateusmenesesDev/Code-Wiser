import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Dashboard from '~/features/dashboard/components/Dashboard';
import Projects from '~/features/projects/components/Projects';
import { api } from '~/trpc/server';

export const metadata: Metadata = {
	title: 'Dashboard | CodeWise',
	description:
		'Keep your software development learning journey moving with projects, sprints, reviews, and mentorship in one place.',
	openGraph: {
		title: 'Dashboard | CodeWise',
		description:
			'Keep your software development learning journey moving with projects, sprints, reviews, and mentorship in one place.',
		type: 'website'
	}
};

export default async function Home({
	searchParams
}: {
	searchParams: { userId?: string | string[] };
}) {
	const { userId } = auth();
	const requestedUserId =
		typeof searchParams.userId === 'string' ? searchParams.userId : undefined;

	if (userId) {
		const dashboard = await api.dashboard.getOverview(
			requestedUserId ? { userId: requestedUserId } : undefined
		);
		return (
			<div className="dark -m-6 min-h-[calc(100vh-4.5rem)] bg-[#0d1119] px-4 py-8 sm:px-8 lg:px-12">
				<Dashboard
					initialData={dashboard}
					userId={dashboard.viewedUser ? requestedUserId : undefined}
				/>
			</div>
		);
	}

	const projects = await api.projectTemplate.getApproved();
	return (
		<main>
			<Projects initialProjectsData={projects} initialUserProjectsData={[]} />
		</main>
	);
}
