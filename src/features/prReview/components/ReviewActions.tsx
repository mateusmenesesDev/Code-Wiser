import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import { Textarea } from '~/common/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { PullRequestReviewStatusEnum } from '@prisma/client';
import { usePRReview } from '~/features/prReview/hooks/usePRReview';

interface ReviewActionsProps {
	taskId: string;
	status?: PullRequestReviewStatusEnum;
}

export function ReviewActions({ taskId, status }: ReviewActionsProps) {
	const { approvePR, requestChanges, isApproving, isRequestingChanges } =
		usePRReview();
	const [showRequestChangesDialog, setShowRequestChangesDialog] =
		useState(false);
	const [comment, setComment] = useState('');

	const isApproved = status === PullRequestReviewStatusEnum.APPROVED;

	const handleApprove = () => {
		approvePR({ taskId });
	};

	const handleRequestChanges = () => {
		requestChanges({
			taskId,
			comment: comment.trim() || undefined
		});
		setComment('');
		setShowRequestChangesDialog(false);
	};

	return (
		<>
			<div className="flex gap-2">
				<Button
					variant="default"
					size="sm"
					onClick={handleApprove}
					disabled={isApproving || isRequestingChanges || isApproved}
					className="bg-success hover:bg-success/90"
				>
					<CheckCircle2 className="mr-2 h-4 w-4" />
					Approve
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => setShowRequestChangesDialog(true)}
					disabled={isApproving || isRequestingChanges}
				>
					<XCircle className="mr-2 h-4 w-4" />
					Request Changes
				</Button>
			</div>

			<Dialog
				open={showRequestChangesDialog}
				onOpenChange={setShowRequestChangesDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Request Changes</DialogTitle>
						<DialogDescription>
							Add a comment explaining what needs to be changed (optional). If
							you don't add a comment, a generic message will be shown to the
							student.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Textarea
							placeholder="Explain what needs to be changed..."
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowRequestChangesDialog(false);
								setComment('');
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleRequestChanges}
							disabled={isRequestingChanges}
						>
							Request Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
