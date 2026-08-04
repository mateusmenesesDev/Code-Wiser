'use client';

import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { useDialog } from '~/common/hooks/useDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import { DIFFICULTY_LABELS, difficultyBadgeVariant } from '../lib/difficulty';
import {
	PROGRESS_STATUS_LABELS,
	progressStatusBadgeVariant
} from '../lib/progressStatus';

type ExerciseChallengePageProps = {
	trackSlug: string;
	challengeSlug: string;
};

export default function ExerciseChallengePage({
	trackSlug,
	challengeSlug
}: ExerciseChallengePageProps) {
	const { user } = useAuth();
	const { openDialog } = useDialog('signIn');
	const utils = api.useUtils();
	const { data: challenge, isLoading, error } =
		api.exercise.getPublishedChallengeBySlug.useQuery({
			trackSlug,
			challengeSlug
		});

	const startMutation = api.exercise.startChallenge.useMutation({
		onSuccess: async () => {
			toast.success('Challenge started');
			await Promise.all([
				utils.exercise.getPublishedChallengeBySlug.invalidate({
					trackSlug,
					challengeSlug
				}),
				utils.exercise.getPublishedTrackBySlug.invalidate({ slug: trackSlug })
			]);
		},
		onError: (mutationError) => toast.error(mutationError.message)
	});

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 text-muted-foreground">
				Loading challenge...
			</div>
		);
	}

	if (error || !challenge) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-muted-foreground">Challenge not found.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link href={`/exercises/${trackSlug}`}>Back to track</Link>
				</Button>
			</div>
		);
	}

	const hasBrief =
		challenge.description &&
		challenge.setupInstructions &&
		challenge.acceptanceCriteria;
	const canStart = Boolean(user) && challenge.status === 'NOT_STARTED';

	return (
		<div className="container mx-auto px-4 py-8">
			<Button asChild variant="ghost" size="sm" className="mb-4">
				<Link href={`/exercises/${challenge.track.slug}`}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					{challenge.track.name}
				</Link>
			</Button>

			<div className="mb-8 flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-sm">
						{challenge.track.name}
					</p>
					<h1 className="font-bold text-3xl text-foreground">
						{challenge.title}
					</h1>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{challenge.status && (
						<Badge variant={progressStatusBadgeVariant(challenge.status)}>
							{PROGRESS_STATUS_LABELS[challenge.status]}
						</Badge>
					)}
					<Badge variant={difficultyBadgeVariant(challenge.difficulty)}>
						{DIFFICULTY_LABELS[challenge.difficulty]}
					</Badge>
				</div>
			</div>

			{canStart && (
				<div className="mb-6">
					<Button
						onClick={() => startMutation.mutate({ id: challenge.id })}
						disabled={startMutation.isPending}
					>
						<Play className="mr-2 h-4 w-4" />
						{startMutation.isPending ? 'Starting...' : 'Start'}
					</Button>
				</div>
			)}

			{!user ? (
				<Card>
					<CardContent className="space-y-4 py-8">
						<p className="text-muted-foreground">
							Sign in to read the full challenge brief, setup instructions, and
							acceptance criteria.
						</p>
						<Button onClick={() => openDialog('signIn')}>Sign in</Button>
					</CardContent>
				</Card>
			) : hasBrief ? (
				<div className="space-y-4">
					{challenge.track.isCloneable && challenge.track.repoUrl && (
						<Card>
							<CardHeader>
								<CardTitle level={2} className="text-lg">
									Repository
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
									git clone {challenge.track.repoUrl}
								</code>
								<a
									href={challenge.track.repoUrl}
									target="_blank"
									rel="noreferrer"
									className="text-sm underline"
								>
									Open on GitHub
								</a>
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle level={2} className="text-lg">
								Description
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-foreground">
								{challenge.description}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle level={2} className="text-lg">
								Setup instructions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-foreground">
								{challenge.setupInstructions}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle level={2} className="text-lg">
								Acceptance criteria
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-foreground">
								{challenge.acceptanceCriteria}
							</p>
						</CardContent>
					</Card>
				</div>
			) : (
				<p className="text-muted-foreground">
					Challenge brief is unavailable.
				</p>
			)}
		</div>
	);
}
