'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { api } from '~/trpc/react';

type ExercisesCatalogPageProps = {
	initialTracks: Array<{
		id: string;
		name: string;
		slug: string;
		description: string;
		sortOrder: number;
		challengeCount: number;
	}>;
};

export default function ExercisesCatalogPage({
	initialTracks
}: ExercisesCatalogPageProps) {
	const { data: tracks = initialTracks } =
		api.exercise.listPublishedTracks.useQuery(undefined, {
			initialData: initialTracks
		});

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-10 max-w-2xl">
				<h1 className="font-bold text-3xl text-foreground">Exercises</h1>
				<p className="mt-2 text-muted-foreground">
					Practice tracks with cloneable challenge repos. Browse publicly, then
					sign in to read full briefs and clone instructions.
				</p>
			</div>

			{tracks.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-16 text-center">
						<BookOpen className="h-10 w-10 text-muted-foreground" />
						<p className="font-medium text-foreground">No tracks published yet</p>
						<p className="max-w-md text-muted-foreground text-sm">
							Exercise tracks will appear here once an admin publishes them.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{tracks.map((track) => (
						<Card key={track.id} className="flex flex-col">
							<CardHeader>
								<div className="flex items-start justify-between gap-3">
									<CardTitle level={2} className="text-xl">
										{track.name}
									</CardTitle>
									<Badge variant="secondary">
										{track.challengeCount}{' '}
										{track.challengeCount === 1 ? 'challenge' : 'challenges'}
									</Badge>
								</div>
								<CardDescription className="line-clamp-3">
									{track.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="mt-auto">
								<Button asChild className="w-full">
									<Link href={`/exercises/${track.slug}`}>View track</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
