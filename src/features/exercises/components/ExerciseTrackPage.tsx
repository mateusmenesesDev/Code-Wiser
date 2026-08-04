'use client';

import { ArrowLeft, Copy, Terminal } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import { DIFFICULTY_LABELS, difficultyBadgeVariant } from '../lib/difficulty';
import {
	PROGRESS_STATUS_LABELS,
	progressStatusBadgeVariant
} from '../lib/progressStatus';

type ExerciseTrackPageProps = {
	trackSlug: string;
};

export default function ExerciseTrackPage({
	trackSlug
}: ExerciseTrackPageProps) {
	const { user } = useAuth();
	const { data: track, isLoading, error } =
		api.exercise.getPublishedTrackBySlug.useQuery({ slug: trackSlug });

	const copyCloneCommand = async () => {
		if (!track?.repoUrl) return;
		const command = `git clone ${track.repoUrl}`;
		await navigator.clipboard.writeText(command);
		toast.success('Clone command copied');
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 text-muted-foreground">
				Loading track...
			</div>
		);
	}

	if (error || !track) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-muted-foreground">Track not found.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link href="/exercises">Back to exercises</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<Button asChild variant="ghost" size="sm" className="mb-4">
				<Link href="/exercises">
					<ArrowLeft className="mr-2 h-4 w-4" />
					All exercises
				</Link>
			</Button>

			<div className="mb-8 max-w-3xl">
				<h1 className="font-bold text-3xl text-foreground">{track.name}</h1>
				<p className="mt-2 text-muted-foreground">{track.description}</p>
			</div>

			{user ? (
				track.isCloneable && track.repoUrl ? (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle level={2} className="flex items-center gap-2 text-lg">
								<Terminal className="h-5 w-5" />
								Clone the track repository
							</CardTitle>
							<CardDescription>
								All challenges for this track live in one repo with tests
								included. Clone it locally and work through the list below.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
								git clone {track.repoUrl}
							</code>
							<div className="flex flex-wrap gap-2">
								<Button variant="outline" onClick={copyCloneCommand}>
									<Copy className="mr-2 h-4 w-4" />
									Copy command
								</Button>
								<Button asChild variant="outline">
									<a href={track.repoUrl} target="_blank" rel="noreferrer">
										Open on GitHub
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				) : (
					<Card className="mb-8">
						<CardContent className="py-6 text-muted-foreground text-sm">
							This track does not have a cloneable repository URL yet.
						</CardContent>
					</Card>
				)
			) : (
				<Card className="mb-8">
					<CardContent className="py-6 text-muted-foreground text-sm">
						Sign in to see clone instructions and full challenge briefs.
					</CardContent>
				</Card>
			)}

			<div className="space-y-3">
				<h2 className="font-semibold text-xl">Challenges</h2>
				{track.challenges.length === 0 ? (
					<p className="text-muted-foreground">
						No challenges published in this track yet.
					</p>
				) : (
					track.challenges.map((challenge, index) => (
						<Link
							key={challenge.id}
							href={`/exercises/${track.slug}/${challenge.slug}`}
							className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
						>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-muted-foreground text-sm">
										Challenge {index + 1}
									</p>
									<p className="font-medium text-foreground">
										{challenge.title}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{challenge.status && (
										<Badge
											variant={progressStatusBadgeVariant(challenge.status)}
										>
											{PROGRESS_STATUS_LABELS[challenge.status]}
										</Badge>
									)}
									<Badge variant={difficultyBadgeVariant(challenge.difficulty)}>
										{DIFFICULTY_LABELS[challenge.difficulty]}
									</Badge>
								</div>
							</div>
						</Link>
					))
				)}
			</div>
		</div>
	);
}
