import { MentorshipDashboard } from '~/features/mentorship/components/mentorship-dashboard';
import { api } from '~/trpc/server';
import { redirect } from 'next/navigation';

export default async function MentorshipPage() {
	const status = await api.user.getMentorshipStatus();

	if (!status || status.mentorshipStatus !== 'ACTIVE') {
		redirect('/pricing');
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl text-foreground">
					Mentorship Sessions
				</h1>
				<p className="mt-2 text-muted-foreground">
					Schedule and manage your one-on-one mentorship sessions
				</p>
			</div>

			<MentorshipDashboard />
		</div>
	);
}
