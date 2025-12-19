import {
	CheckCircle2,
	XCircle,
	AlertCircle,
	GitBranch,
	ExternalLink
} from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Card, CardContent } from '~/common/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { Button } from '~/common/components/ui/button';
import { PullRequestReviewStatusEnum } from '@prisma/client';
import { ReviewActions } from './ReviewActions';
import type { PRReviewApiOutput } from '~/features/prReview/types/prReview.type';
import { cn } from '~/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '~/common/components/ui/skeleton';

interface ReviewListProps {
	reviews: PRReviewApiOutput[];
	isLoading?: boolean;
}

export function ReviewTable({ reviews, isLoading }: ReviewListProps) {
	const router = useRouter();

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

	const handleViewTask = (projectId: string, taskId: string) => {
		router.push(`/workspace/${projectId}?taskId=${taskId}`);
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Task</TableHead>
								<TableHead>Project</TableHead>
								<TableHead>Student</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>PR URL</TableHead>
								<TableHead>Comment</TableHead>
								<TableHead>Reviewed By</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 5 }, () => (
								<TableRow key={crypto.randomUUID()}>
									<TableCell>
										<Skeleton className="h-4 w-32 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-28 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-20 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-16 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-40 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24 rounded" />
									</TableCell>
									<TableCell>
										<Skeleton className="ml-auto h-8 w-24 rounded" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
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
		<Card>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Task</TableHead>
							<TableHead>Project</TableHead>
							<TableHead>Student</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>PR URL</TableHead>
							<TableHead>Comment</TableHead>
							<TableHead>Reviewed By</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{reviews.map((review) => {
							const statusBadge = getStatusBadge(review.status);
							const student = review.task.assignee;
							const project = review.task.project;

							return (
								<TableRow key={review.id}>
									<TableCell className="font-medium">
										{review.task.title}
									</TableCell>
									<TableCell>
										{project ? (
											<span className="text-muted-foreground text-sm">
												{project.title}
											</span>
										) : (
											<span className="text-muted-foreground text-sm">N/A</span>
										)}
									</TableCell>
									<TableCell>
										{student ? (
											<span className="text-muted-foreground text-sm">
												{student.name || student.email}
											</span>
										) : (
											<span className="text-muted-foreground text-sm">N/A</span>
										)}
									</TableCell>
									<TableCell>
										{statusBadge && (
											<Badge
												variant={statusBadge.variant}
												className={cn(
													'flex w-fit items-center gap-1',
													statusBadge.className
												)}
											>
												<statusBadge.icon className="h-3 w-3" />
												{statusBadge.text}
											</Badge>
										)}
									</TableCell>
									<TableCell>
										{review.prUrl ? (
											<Link
												href={review.prUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1 text-primary text-sm hover:underline"
											>
												<GitBranch className="h-3 w-3" />
												View PR
											</Link>
										) : (
											<span className="text-muted-foreground text-sm">N/A</span>
										)}
									</TableCell>
									<TableCell>
										{review.comment ? (
											<div className="max-w-xs">
												<p className="line-clamp-2 text-muted-foreground text-sm">
													{review.comment}
												</p>
											</div>
										) : review.status ===
											PullRequestReviewStatusEnum.CHANGES_REQUESTED ? (
											<span className="text-muted-foreground text-sm italic">
												Changes requested
											</span>
										) : (
											<span className="text-muted-foreground text-sm">—</span>
										)}
									</TableCell>
									<TableCell>
										<span className="text-muted-foreground text-sm">
											{review.reviewedBy.name || review.reviewedBy.email}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											{project && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleViewTask(project.id, review.taskId)
													}
													className="flex items-center gap-1"
												>
													<ExternalLink className="h-3 w-3" />
													View Task
												</Button>
											)}
											{review.isActive && (
												<ReviewActions
													taskId={review.taskId}
													status={review.status}
												/>
											)}
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
