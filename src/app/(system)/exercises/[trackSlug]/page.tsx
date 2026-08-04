import type { Metadata } from 'next';
import ExerciseTrackPage from '~/features/exercises/components/ExerciseTrackPage';

type PageProps = {
	params: { trackSlug: string };
};

export function generateMetadata({ params }: PageProps): Metadata {
	return {
		title: `${params.trackSlug} exercises`
	};
}

export default function ExerciseTrackRoutePage({ params }: PageProps) {
	return <ExerciseTrackPage trackSlug={params.trackSlug} />;
}
