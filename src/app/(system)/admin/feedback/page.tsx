import { Suspense } from 'react';
import { AdminFeedbackPage } from '~/features/feedback/AdminFeedbackPage';

export default function AdminFeedbackInboxPage() {
	return (
		<Suspense>
			<AdminFeedbackPage />
		</Suspense>
	);
}
