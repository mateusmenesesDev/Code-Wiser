'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Label } from '~/common/components/ui/label';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

type NotifyPrUpdatedDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	submissionId: string;
	prUrl: string;
	trackSlug: string;
	challengeSlug: string;
};

export function NotifyPrUpdatedDialog({
	open,
	onOpenChange,
	submissionId,
	prUrl,
	trackSlug,
	challengeSlug
}: NotifyPrUpdatedDialogProps) {
	const utils = api.useUtils();
	const [updateNote, setUpdateNote] = useState('');

	useEffect(() => {
		if (!open) return;
		setUpdateNote('');
	}, [open]);

	const notifyMutation = api.exercise.notifyPrUpdated.useMutation({
		onSuccess: async () => {
			toast.success('Mentor notified about your PR update');
			onOpenChange(false);
			await Promise.all([
				utils.exercise.getPublishedChallengeBySlug.invalidate({
					trackSlug,
					challengeSlug
				}),
				utils.exercise.getPublishedTrackBySlug.invalidate({ slug: trackSlug })
			]);
		},
		onError: (error) => toast.error(error.message)
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>I updated the PR</DialogTitle>
					<DialogDescription>
						Confirm that you pushed updates to the same pull request. Challenges
						with changes requested will return to review; approved ones stay
						approved.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="rounded-md bg-muted px-3 py-2 text-sm">
						<a href={prUrl} target="_blank" rel="noreferrer" className="underline">
							{prUrl}
						</a>
					</div>
					<div className="space-y-2">
						<Label htmlFor="pr-update-note">Note for mentor (optional)</Label>
						<Textarea
							id="pr-update-note"
							placeholder="What changed in this update?"
							value={updateNote}
							onChange={(event) => setUpdateNote(event.target.value)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={notifyMutation.isPending}
						onClick={() =>
							notifyMutation.mutate({
								submissionId,
								updateNote: updateNote.trim() || undefined
							})
						}
					>
						{notifyMutation.isPending ? 'Notifying...' : 'Notify mentor'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
