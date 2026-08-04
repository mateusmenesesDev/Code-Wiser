import type { Metadata } from 'next';
import ExerciseChallengePage from '~/features/exercises/components/ExerciseChallengePage';

type PageProps = {
	params: { trackSlug: string; challengeSlug: string };
};

export function generateMetadata({ params }: PageProps): Metadata {
	return {
		title: `${params.challengeSlug} · ${params.trackSlug}`
	};
}

export default function ExerciseChallengeRoutePage({ params }: PageProps) {
	return (
		<ExerciseChallengePage
			trackSlug={params.trackSlug}
			challengeSlug={params.challengeSlug}
		/>
	);
}
