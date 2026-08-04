'use client';

import { Protect } from '@clerk/nextjs';
import { ExerciseReviewDecisionStatus } from '@prisma/client';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';
import { DIFFICULTY_LABELS, difficultyBadgeVariant } from '../lib/difficulty';

type AdminExerciseReviewDetailPageProps = {
	submissionId: string;
};

export default function AdminExerciseReviewDetailPage({
	submissionId
}: AdminExerciseReviewDetailPageProps) {
	const utils = api.useUtils();
	const { data: submission, isLoading, error } =
		api.exercise.adminGetReviewSubmission.useQuery({ id: submissionId });
	const [comments, setComments] = useState<Record<string, string>>({});

	const decideMutation = api.exercise.decideChallengeReview.useMutation({
		onSuccess: async () => {
			toast.success('Decision saved');
			await Promise.all([
				utils.exercise.adminGetReviewSubmission.invalidate({
					id: submissionId
				}),
				utils.exercise.adminListReviewQueue.invalidate()
			]);
		},
		onError: (mutationError) => toast.error(mutationError.message)
	});

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 text-muted-foreground">
				Loading submission...
			</div>
		);
	}

	if (error || !submission) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-muted-foreground">Submission not found.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link href="/admin/exercise-reviews">Back to queue</Link>
				</Button>
			</div>
		);
	}

	return (
		// biome-ignore lint/a11y/useValidAriaRole: Clerk Protect uses role for org authorization
		<Protect role="org:admin">
			<div className="container mx-auto px-4 py-8">
				<Button asChild variant="ghost" size="sm" className="mb-4">
					<Link href="/admin/exercise-reviews">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Exercise review queue
					</Link>
				</Button>

				<div className="mb-8 space-y-2">
					<h1 className="font-bold text-3xl text-foreground">
						{submission.track.name}
					</h1>
					<p className="text-muted-foreground">
						{submission.submittedBy.name || 'Unnamed'} ·{' '}
						{submission.submittedBy.email}
					</p>
					<a
						href={submission.prUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 underline"
					>
						{submission.prUrl}
						<ExternalLink className="h-4 w-4" />
					</a>
				</div>

				<div className="space-y-4">
					{submission.decisions.map((decision) => {
						const isPending =
							decision.status === ExerciseReviewDecisionStatus.PENDING;
						return (
							<Card key={decision.id}>
								<CardHeader>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<CardTitle level={2} className="text-xl">
												{decision.challenge.title}
											</CardTitle>
											<CardDescription className="mt-1">
												Acceptance criteria
											</CardDescription>
										</div>
										<div className="flex flex-wrap gap-2">
											<Badge
												variant={difficultyBadgeVariant(
													decision.challenge.difficulty
												)}
											>
												{DIFFICULTY_LABELS[decision.challenge.difficulty]}
											</Badge>
											<Badge
												variant={
													decision.status === 'PENDING'
														? 'warning'
														: decision.status === 'APPROVED'
															? 'success'
															: 'destructive'
												}
											>
												{decision.status === 'PENDING'
													? 'Pending'
													: decision.status === 'APPROVED'
														? 'Approved'
														: 'Changes requested'}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="whitespace-pre-wrap text-sm">
										{decision.challenge.acceptanceCriteria}
									</p>

									{decision.mentorComment && (
										<div className="rounded-md border bg-muted/40 p-3 text-sm">
											<p className="mb-1 font-medium">Mentor comment</p>
											<p className="whitespace-pre-wrap">
												{decision.mentorComment}
											</p>
										</div>
									)}

									{isPending ? (
										<>
											<Textarea
												placeholder="Optional comment for the mentee"
												value={comments[decision.id] ?? ''}
												onChange={(event) =>
													setComments((current) => ({
														...current,
														[decision.id]: event.target.value
													}))
												}
											/>
											<div className="flex flex-wrap gap-2">
												<Button
													disabled={decideMutation.isPending}
													onClick={() =>
														decideMutation.mutate({
															decisionId: decision.id,
															status: ExerciseReviewDecisionStatus.APPROVED,
															mentorComment: comments[decision.id]
														})
													}
												>
													Approve
												</Button>
												<Button
													variant="destructive"
													disabled={decideMutation.isPending}
													onClick={() =>
														decideMutation.mutate({
															decisionId: decision.id,
															status:
																ExerciseReviewDecisionStatus.CHANGES_REQUESTED,
															mentorComment: comments[decision.id]
														})
													}
												>
													Request changes
												</Button>
											</div>
										</>
									) : (
										<p className="text-muted-foreground text-sm">
											Decision already recorded
											{decision.reviewedBy?.name
												? ` by ${decision.reviewedBy.name}`
												: ''}
											.
										</p>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</Protect>
	);
}
