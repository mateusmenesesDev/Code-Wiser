'use client';

import { ArrowLeft, GitPullRequest, Play, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { NotifyPrUpdatedDialog } from './NotifyPrUpdatedDialog';
import { RequestExerciseReviewDialog } from './RequestExerciseReviewDialog';

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
	const [reviewOpen, setReviewOpen] = useState(false);
	const [prUpdatedOpen, setPrUpdatedOpen] = useState(false);
	const { data: challenge, isLoading, error } =
		api.exercise.getPublishedChallengeBySlug.useQuery({
			trackSlug,
			challengeSlug
		});
	const { data: track } = api.exercise.getPublishedTrackBySlug.useQuery(
		{ slug: trackSlug },
		{ enabled: Boolean(user) }
	);
	const { data: mentorshipStatus } = api.user.getMentorshipStatus.useQuery(
		undefined,
		{ enabled: Boolean(user) }
	);
	const hasActiveMentorship = mentorshipStatus?.mentorshipStatus === 'ACTIVE';
	const canRequestReview =
		Boolean(user) &&
		challenge?.status !== 'IN_REVIEW' &&
		challenge?.status !== 'CHANGES_REQUESTED';
	const canNotifyPrUpdate =
		Boolean(user) &&
		challenge?.status === 'CHANGES_REQUESTED' &&
		Boolean(challenge.updatableSubmission);

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

			{(canStart || canRequestReview || canNotifyPrUpdate) && (
				<div className="mb-6 flex flex-wrap gap-3">
					{canStart && (
						<Button
							onClick={() => startMutation.mutate({ id: challenge.id })}
							disabled={startMutation.isPending}
						>
							<Play className="mr-2 h-4 w-4" />
							{startMutation.isPending ? 'Starting...' : 'Start'}
						</Button>
					)}
					{canRequestReview &&
						(hasActiveMentorship ? (
							<Button variant="outline" onClick={() => setReviewOpen(true)}>
								<GitPullRequest className="mr-2 h-4 w-4" />
								{challenge.status === 'APPROVED'
									? 'Request review again'
									: 'Request review'}
							</Button>
						) : (
							<div className="w-full space-y-2 rounded-md border p-4">
								<p className="text-muted-foreground text-sm">
									Active mentorship is required to request exercise reviews.
									There is no credits fallback for this flow.
								</p>
								<Button asChild variant="outline" size="sm">
									<Link href="/pricing">View mentorship plans</Link>
								</Button>
							</div>
						))}
					{canNotifyPrUpdate &&
						(hasActiveMentorship ? (
							<Button variant="outline" onClick={() => setPrUpdatedOpen(true)}>
								<RefreshCw className="mr-2 h-4 w-4" />
								I updated the PR
							</Button>
						) : (
							<div className="w-full space-y-2 rounded-md border p-4">
								<p className="text-muted-foreground text-sm">
									Active mentorship is required to notify a PR update.
								</p>
								<Button asChild variant="outline" size="sm">
									<Link href="/pricing">View mentorship plans</Link>
								</Button>
							</div>
						))}
				</div>
			)}

			{challenge.latestMentorFeedback && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle level={2} className="text-lg">
							Mentor feedback
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Badge
							variant={
								challenge.latestMentorFeedback.status === 'APPROVED'
									? 'success'
									: 'destructive'
							}
						>
							{challenge.latestMentorFeedback.status === 'APPROVED'
								? 'Approved'
								: 'Changes requested'}
						</Badge>
						{challenge.latestMentorFeedback.mentorComment ? (
							<p className="whitespace-pre-wrap text-sm">
								{challenge.latestMentorFeedback.mentorComment}
							</p>
						) : (
							<p className="text-muted-foreground text-sm">
								No comment left with this decision.
							</p>
						)}
						<a
							href={challenge.latestMentorFeedback.prUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-block text-sm underline"
						>
							Open related PR
						</a>
					</CardContent>
				</Card>
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

			{track && challenge && (
				<RequestExerciseReviewDialog
					open={reviewOpen}
					onOpenChange={setReviewOpen}
					trackId={track.id}
					trackSlug={track.slug}
					challenges={track.challenges}
					initialChallengeIds={[challenge.id]}
				/>
			)}

			{challenge.updatableSubmission && (
				<NotifyPrUpdatedDialog
					open={prUpdatedOpen}
					onOpenChange={setPrUpdatedOpen}
					submissionId={challenge.updatableSubmission.id}
					prUrl={challenge.updatableSubmission.prUrl}
					trackSlug={trackSlug}
					challengeSlug={challengeSlug}
				/>
			)}
		</div>
	);
}
