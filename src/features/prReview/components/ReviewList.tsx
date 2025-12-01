import { CheckCircle2, XCircle, AlertCircle, GitBranch } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { PullRequestReviewStatusEnum } from '@prisma/client';
import { ReviewActions } from './ReviewActions';
import type { PRReviewApiOutput } from '~/features/prReview/types/prReview.type';
import { cn } from '~/lib/utils';
import Link from 'next/link';

interface ReviewListProps {
	reviews: PRReviewApiOutput[];
	isLoading?: boolean;
}

export function ReviewList({ reviews, isLoading }: ReviewListProps) {
	const getStatusBadge = (status: PullRequestReviewStatusEnum) => {
		switch (status) {
			case PullRequestReviewStatusEnum.APPROVED:
				return {
					variant: 'default' as const,
					icon: CheckCircle2,
					text: 'Approved',
					className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
				};
			case PullRequestReviewStatusEnum.CHANGES_REQUESTED:
				return {
					variant: 'destructive' as const,
					icon: XCircle,
					text: 'Changes Requested',
					className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
				};
			case PullRequestReviewStatusEnum.PENDING:
				return {
					variant: 'secondary' as const,
					icon: AlertCircle,
					text: 'Pending Review',
					className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
				};
			default:
				return null;
		}
	};

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, () => (
					<Card key={crypto.randomUUID()} className="animate-pulse">
						<CardHeader>
							<div className="h-4 w-3/4 rounded bg-muted" />
							<div className="h-3 w-1/2 rounded bg-muted" />
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="h-3 rounded bg-muted" />
								<div className="h-3 w-2/3 rounded bg-muted" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (reviews.length === 0) {
		return (
			<Card className="py-16 text-center">
				<CardContent>
					<AlertCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
					<h2 className="mb-2 font-semibold text-lg">No PR reviews found</h2>
					<p className="text-muted-foreground text-sm">
						There are no pull request reviews to display.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{reviews.map((review) => {
				const statusBadge = getStatusBadge(review.status);
				const student = review.task.assignee;
				const project = review.task.project;

				return (
					<Card key={review.id} className="transition-shadow hover:shadow-lg">
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<CardTitle className="mb-2 text-lg">{review.task.title}</CardTitle>
									{project && (
										<CardDescription className="mb-1">
											Project: {project.title}
										</CardDescription>
									)}
									{student && (
										<CardDescription>
											Student: {student.name || student.email}
										</CardDescription>
									)}
								</div>
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
						</CardHeader>
						<CardContent className="space-y-4">
							{review.prUrl && (
								<Link
									href={review.prUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-primary hover:underline"
								>
									<GitBranch className="h-4 w-4" />
									<span className="text-sm">View Pull Request</span>
								</Link>
							)}

							{review.comment && (
								<div className="rounded-lg border bg-muted/20 p-3">
									<p className="mb-1 font-medium text-xs">Review Comment:</p>
									<p className="text-muted-foreground text-sm">{review.comment}</p>
								</div>
							)}

							{review.status === PullRequestReviewStatusEnum.CHANGES_REQUESTED &&
								!review.comment && (
									<p className="text-muted-foreground text-sm italic">
										Changes requested - please review the feedback and update your
										PR
									</p>
								)}

							<div className="flex items-center justify-between border-t pt-4">
								<p className="text-muted-foreground text-xs">
									Reviewed by: {review.reviewedBy.name || review.reviewedBy.email}
								</p>
								{review.isActive && (
									<ReviewActions taskId={review.taskId} />
								)}
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

