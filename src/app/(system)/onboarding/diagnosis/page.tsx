import type { Metadata } from 'next';
import { LearnerDiagnosisForm } from '~/features/onboarding/components/LearnerDiagnosisForm';

export const metadata: Metadata = {
	title: 'Learning diagnosis | CodeWise',
	description:
		'Tell us about your goals so CodeWise can guide your first activity.'
};

export default function LearnerDiagnosisPage({
	searchParams
}: {
	searchParams: { returnTo?: string | string[] };
}) {
	const requestedReturnTo =
		typeof searchParams.returnTo === 'string' ? searchParams.returnTo : '/';
	const returnTo =
		requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//')
			? requestedReturnTo
			: '/';

	return (
		<main className="container mx-auto px-4 py-10">
			<LearnerDiagnosisForm returnTo={returnTo} />
		</main>
	);
}
