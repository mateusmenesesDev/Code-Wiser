import { PullRequestReviewStatusEnum } from '@prisma/client';
import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Textarea } from '~/common/components/ui/textarea';
import { AIReviewDialog } from '~/features/prReview/components/AIReviewDialog';
import { usePRReview } from '~/features/prReview/hooks/usePRReview';

interface ReviewActionsProps {
	reviewId: string;
	taskId: string;
	status?: PullRequestReviewStatusEnum;
}

export function ReviewActions({
	reviewId,
	taskId,
	status
}: ReviewActionsProps) {
	const {
		approvePR,
		requestChanges,
		startAIAnalysis,
		isApproving,
		isRequestingChanges,
		isStartingAIAnalysis
	} = usePRReview();
	const [showRequestChangesDialog, setShowRequestChangesDialog] =
		useState(false);
	const [showAIReviewDialog, setShowAIReviewDialog] = useState(false);
	const [comment, setComment] = useState('');
	const [analysisId, setAnalysisId] = useState<string>();

	const isApproved = status === PullRequestReviewStatusEnum.APPROVED;
	const isBusy = isApproving || isRequestingChanges || isStartingAIAnalysis;

	const handleApprove = () => {
		approvePR({ taskId });
	};

	const handleRequestChanges = () => {
		requestChanges({
			taskId,
			comment: comment.trim() || undefined,
			analysisId
		});
		setComment('');
		setAnalysisId(undefined);
		setShowRequestChangesDialog(false);
	};

	return (
		<>
			<div className="flex flex-wrap justify-end gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setShowAIReviewDialog(true);
						startAIAnalysis({ reviewId });
					}}
					disabled={isBusy || isApproved}
				>
					{isStartingAIAnalysis ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Sparkles className="mr-2 h-4 w-4" />
					)}
					Analyze with AI
				</Button>
				<Button
					variant="default"
					size="sm"
					onClick={handleApprove}
					disabled={isBusy || isApproved}
					className="bg-success hover:bg-success/90"
				>
					<CheckCircle2 className="mr-2 h-4 w-4" />
					Approve
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => setShowRequestChangesDialog(true)}
					disabled={isBusy}
				>
					<XCircle className="mr-2 h-4 w-4" />
					Request Changes
				</Button>
			</div>

			<AIReviewDialog
				reviewId={reviewId}
				open={showAIReviewDialog}
				onOpenChange={setShowAIReviewDialog}
				onUseAccepted={(acceptedComment, acceptedAnalysisId) => {
					setComment(acceptedComment);
					setAnalysisId(acceptedAnalysisId);
					setShowAIReviewDialog(false);
					setShowRequestChangesDialog(true);
				}}
			/>

			<Dialog
				open={showRequestChangesDialog}
				onOpenChange={setShowRequestChangesDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Request Changes</DialogTitle>
						<DialogDescription>
							Add or edit the feedback before sending it to the student. Only
							feedback you approve is included from the AI analysis.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Textarea
							placeholder="Explain what needs to be changed..."
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							className="min-h-[180px]"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowRequestChangesDialog(false);
								setComment('');
								setAnalysisId(undefined);
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
