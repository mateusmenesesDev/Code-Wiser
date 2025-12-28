import { PullRequestReviewStatusEnum } from '@prisma/client';
import { AlertCircle, CheckCircle2, GitBranch, XCircle } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Separator } from '~/common/components/ui/separator';
import { usePRReview } from '~/features/prReview/hooks/usePRReview';
import { cn } from '~/lib/utils';

interface PullRequestProps {
	taskId?: string;
	prUrl?: string | null;
	isEditing: boolean;
}

export function PullRequest({ taskId, prUrl, isEditing }: PullRequestProps) {
	const { data: activeReview } = usePRReview().getActiveByTaskId(
		{ taskId: taskId || '' },
		{ enabled: !!taskId }
	);

	const getStatusBadge = (status: PullRequestReviewStatusEnum) => {
		switch (status) {
			case PullRequestReviewStatusEnum.APPROVED:
				return {
					variant: 'success' as const,
					icon: CheckCircle2,
					text: 'Approved',
					className: ''
				};
			case PullRequestReviewStatusEnum.CHANGES_REQUESTED:
				return {
					variant: 'destructive' as const,
					icon: XCircle,
					text: 'Changes Requested',
					className: ''
				};
			case PullRequestReviewStatusEnum.PENDING:
				return {
					variant: 'warning' as const,
					icon: AlertCircle,
					text: 'Pending Review',
					className: ''
				};
			default:
				return null;
		}
	};

	const statusBadge = activeReview ? getStatusBadge(activeReview.status) : null;

	return (
		<div className={cn('space-y-4', !isEditing && 'opacity-50')}>
			<div>
				<h3 className="mb-2 font-medium text-muted-foreground text-sm">
					Pull Request
				</h3>
				{prUrl ? (
					<div className="space-y-2">
						<Button variant="outline" size="sm" className="w-full" asChild>
							<a
								href={prUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center gap-2"
							>
								<GitBranch className="h-4 w-4" />
								View Pull Request
							</a>
						</Button>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						No pull request URL provided
					</p>
				)}
			</div>

			{activeReview && (
				<>
					<Separator />
					<div className="space-y-3 rounded-lg border bg-muted/20 p-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-sm">Review Status</h4>
							{statusBadge && (
								<Badge
									variant={statusBadge.variant}
									className={cn(
										'flex items-center gap-1',
										statusBadge.className
									)}
								>
									<statusBadge.icon className="h-3 w-3" />
									{statusBadge.text}
								</Badge>
							)}
						</div>

						{activeReview.status ===
							PullRequestReviewStatusEnum.CHANGES_REQUESTED && (
							<div className="space-y-2">
								{activeReview.comment ? (
									<div className="space-y-1">
										<p className="font-medium text-muted-foreground text-xs">
											Reviewer Feedback:
										</p>
										<div
											className="prose prose-sm dark:prose-invert max-w-none text-sm"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML content from trusted source (database)
											dangerouslySetInnerHTML={{ __html: activeReview.comment }}
										/>
									</div>
								) : (
									<p className="text-muted-foreground text-sm italic">
										Changes requested - please review the feedback and update
										your PR
									</p>
								)}
								<p className="text-muted-foreground text-xs">
									Reviewed by:{' '}
									{activeReview.reviewedBy.name ||
										activeReview.reviewedBy.email}
								</p>
							</div>
						)}

						{activeReview.status === PullRequestReviewStatusEnum.APPROVED && (
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">
									Your pull request has been approved!
								</p>
								<p className="text-muted-foreground text-xs">
									Approved by:{' '}
									{activeReview.reviewedBy.name ||
										activeReview.reviewedBy.email}
								</p>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
