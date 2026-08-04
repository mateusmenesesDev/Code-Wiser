import AdminExerciseReviewDetailPage from '~/features/exercises/components/AdminExerciseReviewDetailPage';

type PageProps = {
	params: { id: string };
};

export default function AdminExerciseReviewDetailRoutePage({
	params
}: PageProps) {
	return <AdminExerciseReviewDetailPage submissionId={params.id} />;
}
