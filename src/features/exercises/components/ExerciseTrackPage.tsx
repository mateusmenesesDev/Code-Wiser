'use client';

import {
	ArrowLeft,
	Copy,
	GitPullRequest,
	ListChecks,
	Terminal
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { RequestExerciseReviewDialog } from './RequestExerciseReviewDialog';

type ExerciseTrackPageProps = {
	trackSlug: string;
};

export default function ExerciseTrackPage({
	trackSlug
}: ExerciseTrackPageProps) {
	const { user } = useAuth();
	const [reviewOpen, setReviewOpen] = useState(false);
	const {
		data: track,
		isLoading,
		error
	} = api.exercise.getPublishedTrackBySlug.useQuery({ slug: trackSlug });
	const { data: mentorshipStatus } = api.user.getMentorshipStatus.useQuery(
		undefined,
		{ enabled: Boolean(user) }
	);
	const hasActiveMentorship = mentorshipStatus?.mentorshipStatus === 'ACTIVE';
	const isArchived = Boolean(track?.isArchived);

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
				<div className="mb-2 flex flex-wrap items-center gap-2">
					{isArchived && <Badge variant="secondary">Archived</Badge>}
				</div>
				<h1 className="font-bold text-3xl text-foreground">{track.name}</h1>
				<p className="mt-2 text-muted-foreground">{track.description}</p>
				{isArchived && (
					<p className="mt-3 text-muted-foreground text-sm">
						This track is archived. You can still view your in-flight or past
						progress, but new starts and review requests are closed.
					</p>
				)}
			</div>

			{user ? (
				<>
					{!isArchived && (
						<ol className="mb-8 grid gap-4 md:grid-cols-3">
							<li className="rounded-lg border p-4">
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Step 1
								</p>
								<p className="mt-1 font-semibold text-foreground">
									Clone the repo
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Copy the git clone command and set up the track locally.
								</p>
							</li>
							<li className="rounded-lg border p-4">
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Step 2
								</p>
								<p className="mt-1 font-semibold text-foreground">
									Start a challenge
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Open a challenge below and press Start when you begin work.
								</p>
							</li>
							<li className="rounded-lg border p-4">
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Step 3
								</p>
								<p className="mt-1 font-semibold text-foreground">
									Request review
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Open a GitHub PR, then submit it for mentor review.
								</p>
							</li>
						</ol>
					)}

					{track.isCloneable && track.repoUrl ? (
						<Card className="mb-8">
							<CardHeader>
								<CardTitle
									level={2}
									className="flex items-center gap-2 text-lg"
								>
									<Terminal className="h-5 w-5" />
									{isArchived
										? 'Track repository'
										: '1. Clone the track repository'}
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
									<Button onClick={copyCloneCommand}>
										<Copy className="mr-2 h-4 w-4" />
										Copy clone command
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
					)}

					{!isArchived && (
						<>
							<Card className="mb-8">
								<CardHeader>
									<CardTitle
										level={2}
										className="flex items-center gap-2 text-lg"
									>
										<ListChecks className="h-5 w-5" />
										2. Start challenges
									</CardTitle>
									<CardDescription>
										Open any challenge in the list and press Start challenge
										when you begin. There is no required order.
									</CardDescription>
								</CardHeader>
							</Card>

							<Card className="mb-8">
								<CardHeader>
									<CardTitle
										level={2}
										className="flex items-center gap-2 text-lg"
									>
										<GitPullRequest className="h-5 w-5" />
										3. Request review
									</CardTitle>
									<CardDescription>
										Submit a GitHub PR covering one or more challenges from this
										track. Mentors review the code on GitHub.
									</CardDescription>
								</CardHeader>
								<CardContent>
									{hasActiveMentorship ? (
										<Button onClick={() => setReviewOpen(true)}>
											Request review
										</Button>
									) : (
										<div className="space-y-3">
											<p className="text-muted-foreground text-sm">
												Active mentorship is required to request exercise
												reviews. There is no credits fallback for this flow.
											</p>
											<Button asChild variant="outline">
												<Link href="/pricing">View mentorship plans</Link>
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</>
					)}
				</>
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
									{challenge.isArchived && (
										<Badge variant="secondary">Archived</Badge>
									)}
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

			{track && !isArchived && (
				<RequestExerciseReviewDialog
					open={reviewOpen}
					onOpenChange={setReviewOpen}
					trackId={track.id}
					trackSlug={track.slug}
					repositoryId={track.githubRepository?.id}
					challenges={track.challenges}
				/>
			)}
		</div>
	);
}
