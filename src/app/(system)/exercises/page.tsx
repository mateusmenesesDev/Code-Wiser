import type { Metadata } from 'next';
import ExercisesCatalogPage from '~/features/exercises/components/ExercisesCatalogPage';
import { api } from '~/trpc/server';

export const metadata: Metadata = {
	title: 'Exercises | Practice tracks and challenges',
	description:
		'Browse mentorship exercise tracks such as React, JavaScript, TypeScript, programming logic, Next.js, and Python.'
};

export default async function ExercisesPage() {
	const tracks = await api.exercise.listPublishedTracks();

	return <ExercisesCatalogPage initialTracks={tracks} />;
}
