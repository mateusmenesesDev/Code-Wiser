'use client';

import type { UserChallengeProgressStatus } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { api } from '~/trpc/react';
import { DIFFICULTY_LABELS, difficultyBadgeVariant } from '../lib/difficulty';
import { PROGRESS_STATUS_LABELS } from '../lib/progressStatus';

type SelectableChallenge = {
	id: string;
	title: string;
	slug: string;
	difficulty: 'EASY' | 'MEDIUM' | 'HARD';
	status: UserChallengeProgressStatus | null;
	isArchived?: boolean;
};

type RequestExerciseReviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trackId: string;
	trackSlug: string;
	challenges: SelectableChallenge[];
	initialChallengeIds?: string[];
};

const ACTIVE_REVIEW_STATUSES = new Set<UserChallengeProgressStatus>([
	'IN_REVIEW',
	'CHANGES_REQUESTED'
]);

export function RequestExerciseReviewDialog({
	open,
	onOpenChange,
	trackId,
	trackSlug,
	challenges,
	initialChallengeIds = []
}: RequestExerciseReviewDialogProps) {
	const utils = api.useUtils();
	const [prUrl, setPrUrl] = useState('');
	const [selectedIds, setSelectedIds] = useState<string[]>(initialChallengeIds);

	useEffect(() => {
		if (!open) return;
		setPrUrl('');
		setSelectedIds(initialChallengeIds);
	}, [open, initialChallengeIds]);

	const selectableChallenges = useMemo(
		() =>
			challenges.filter(
				(challenge) =>
					!challenge.isArchived &&
					(!challenge.status || !ACTIVE_REVIEW_STATUSES.has(challenge.status))
			),
		[challenges]
	);

	const requestMutation = api.exercise.requestReview.useMutation({
		onSuccess: async () => {
			toast.success('Review requested');
			onOpenChange(false);
			await Promise.all([
				utils.exercise.getPublishedTrackBySlug.invalidate({ slug: trackSlug }),
				utils.exercise.getPublishedChallengeBySlug.invalidate()
			]);
		},
		onError: (error) => toast.error(error.message)
	});

	const toggleChallenge = (challengeId: string, checked: boolean) => {
		setSelectedIds((current) =>
			checked
				? [...new Set([...current, challengeId])]
				: current.filter((id) => id !== challengeId)
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Request exercise review</DialogTitle>
					<DialogDescription>
						Paste your GitHub pull request URL and select which challenges this
						PR covers. Approved challenges can be submitted again for a new
						review cycle. Challenges already in review or awaiting changes
						cannot be selected.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="exercise-pr-url">GitHub PR URL</Label>
						<Input
							id="exercise-pr-url"
							placeholder="https://github.com/org/repo/pull/12"
							value={prUrl}
							onChange={(event) => setPrUrl(event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Challenges covered</Label>
						{selectableChallenges.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No challenges are available to submit right now. Challenges
								already in review or awaiting changes cannot be selected.
							</p>
						) : (
							<div className="space-y-2 rounded-md border p-3">
								{selectableChallenges.map((challenge) => {
									const checked = selectedIds.includes(challenge.id);
									const checkboxId = `challenge-${challenge.id}`;
									return (
										<label
											key={challenge.id}
											htmlFor={checkboxId}
											className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50"
										>
											<Checkbox
												id={checkboxId}
												checked={checked}
												onCheckedChange={(value) =>
													toggleChallenge(challenge.id, value === true)
												}
											/>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className="font-medium text-sm">
														{challenge.title}
													</span>
													<Badge
														variant={difficultyBadgeVariant(
															challenge.difficulty
														)}
													>
														{DIFFICULTY_LABELS[challenge.difficulty]}
													</Badge>
													{challenge.status && (
														<Badge variant="secondary">
															{PROGRESS_STATUS_LABELS[challenge.status]}
														</Badge>
													)}
												</div>
											</div>
										</label>
									);
								})}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={
							requestMutation.isPending ||
							!prUrl.trim() ||
							selectedIds.length === 0
						}
						onClick={() =>
							requestMutation.mutate({
								trackId,
								prUrl: prUrl.trim(),
								challengeIds: selectedIds
							})
						}
					>
						{requestMutation.isPending ? 'Submitting...' : 'Request review'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
