import AdminExerciseTrackPage from '~/features/exercises/components/AdminExerciseTrackPage';

type PageProps = {
	params: { id: string };
};

export default function AdminExerciseTrackRoutePage({ params }: PageProps) {
	return <AdminExerciseTrackPage trackId={params.id} />;
}
