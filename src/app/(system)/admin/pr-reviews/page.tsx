'use client';

import { Protect } from '@clerk/nextjs';
import { PullRequestReviewStatusEnum } from '@prisma/client';
import { parseAsString, useQueryStates } from 'nuqs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { ReviewTable } from '~/features/prReview/components/ReviewTable';
import { usePRReview } from '~/features/prReview/hooks/usePRReview';

const filtersSearchParams = {
	status: parseAsString.withDefault('all'),
	userId: parseAsString.withDefault('all')
};

function PRReviewsContent() {
	const [filters, setFilters] = useQueryStates(filtersSearchParams);
	const statusFilter =
		(filters.status as PullRequestReviewStatusEnum | 'all') || 'all';
	const userIdFilter = filters.userId || 'all';

	const { data: reviews, isLoading } = usePRReview().getAllReviews(
		{
			status: statusFilter === 'all' ? undefined : statusFilter,
			userId: userIdFilter === 'all' ? undefined : userIdFilter
		},
		{
			refetchOnMount: true,
			refetchOnWindowFocus: true
		}
	);

	const uniqueUsers = Array.from(
		new Map(
			(reviews ?? []).map((review) => [
				review.task.assignee?.id,
				review.task.assignee
			])
		).values()
	).filter(Boolean);

	const filteredReviews = reviews ?? [];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<div className="mb-4">
					<h1 className="font-bold text-3xl">PR Reviews</h1>
					<p className="text-muted-foreground">
						Review and manage student pull requests
					</p>
				</div>

				<div className="flex flex-col gap-4 sm:flex-row">
					<div className="flex-1">
						<Select
							value={statusFilter}
							onValueChange={(value) =>
								setFilters({
									status: value === 'all' ? 'all' : value
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value={PullRequestReviewStatusEnum.PENDING}>
									Pending
								</SelectItem>
								<SelectItem value={PullRequestReviewStatusEnum.APPROVED}>
									Approved
								</SelectItem>
								<SelectItem
									value={PullRequestReviewStatusEnum.CHANGES_REQUESTED}
								>
									Changes Requested
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex-1">
						<Select
							value={userIdFilter}
							onValueChange={(value) =>
								setFilters({
									userId: value === 'all' ? 'all' : value
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Filter by user" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Users</SelectItem>
								{uniqueUsers.map((user) => (
									<SelectItem key={user?.id} value={user?.id || ''}>
										{user?.name || user?.email}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<ReviewTable reviews={filteredReviews} isLoading={isLoading} />
		</div>
	);
}

export default function PRReviewsPage() {
	return (
		// biome-ignore lint/a11y/useValidAriaRole: Clerk Protect component uses role prop for authorization
		<Protect role="org:admin">
			<PRReviewsContent />
		</Protect>
	);
}
