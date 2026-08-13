import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { MyBookingsList } from '~/features/mentorship/components/my-bookings-list';

export default function MentorshipHistoryPage() {
	const { userId } = auth();
	if (!userId) redirect('/');

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl text-foreground">
					Mentorship history
				</h1>
				<p className="mt-2 text-muted-foreground">
					Review your objectives, session notes, and agreed actions.
				</p>
			</div>
			<MyBookingsList readOnly />
		</div>
	);
}
