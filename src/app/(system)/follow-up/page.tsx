import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MentorFollowUpPage from '~/features/mentorFollowUp/components/MentorFollowUpPage';
import { api } from '~/trpc/server';

export default async function FollowUpRoute() {
	const { userId } = auth();
	if (!userId) redirect('/');

	const hasAccess = await api.mentorFollowUp.getAccess();
	if (!hasAccess) redirect('/');

	const overview = await api.mentorFollowUp.getOverview();
	return (
		<div className="-m-6 min-h-[calc(100vh-4.5rem)] px-4 py-8 sm:px-8 lg:px-12">
			<MentorFollowUpPage initialData={overview} />
		</div>
	);
}
