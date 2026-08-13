import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Link from 'next/link';
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
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-foreground">
						{dashboard.viewedUser
							? `${dashboard.viewedUser.name ?? dashboard.viewedUser.email}'s dashboard`
							: 'Your dashboard'}
					</h1>
					<p className="mt-2 text-muted-foreground">
						{dashboard.viewedUser
							? 'You are viewing this learner dashboard as an administrator.'
							: 'See what needs your attention and keep your learning moving.'}
					</p>
					{dashboard.viewedUser && (
						<Link
							href="/"
							className="mt-3 inline-block text-primary text-sm underline-offset-4 hover:underline"
						>
							Return to your dashboard
						</Link>
					)}
				</div>
				<Dashboard
					initialData={dashboard}
					userId={dashboard.viewedUser ? requestedUserId : undefined}
				/>
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
