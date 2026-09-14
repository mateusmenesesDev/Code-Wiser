'use client';

import {
	AlertCircle,
	ArrowUpRight,
	BarChart3,
	Clock3,
	LockKeyhole,
	Search,
	Timer,
	Unlock
} from 'lucide-react';
import Link from 'next/link';
import { parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { api } from '~/trpc/react';

const filtersSearchParams = {
	type: parseAsString.withDefault('all'),
	priority: parseAsString.withDefault('all'),
	search: parseAsString.withDefault('')
};

const queueTypes = [
	['all', 'All items'],
	['PR_REVIEW', 'PR reviews'],
	['EXERCISE_REVIEW', 'Exercise reviews'],
	['BLOCKED_TASK', 'Blocked tasks'],
	['INACTIVE_STUDENT', 'Inactive learners'],
	['MENTORSHIP_SESSION', 'Mentorship sessions']
] as const;

const queuePriorities = [
	['all', 'All priorities'],
	['HIGH', 'High'],
	['MEDIUM', 'Medium'],
	['LOW', 'Low']
] as const;

function ageLabel(hours: number) {
	if (hours < 1) return '<1h';
	if (hours < 24) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}

function priorityVariant(priority: string) {
	return priority === 'HIGH'
		? 'destructive'
		: priority === 'MEDIUM'
			? 'warning'
			: 'secondary';
}

function minutesLabel(minutes: number | null) {
	if (minutes === null) return '—';
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}

export default function MentorAttentionQueue() {
	const [filters, setFilters] = useQueryStates(filtersSearchParams);
	const [searchInput, setSearchInput] = useState(filters.search);
	const utils = api.useUtils();
	const summary = api.mentorAttention.getSummary.useQuery();
	const claim = api.mentorAttention.claim.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.mentorAttention.getQueue.invalidate(),
				utils.mentorAttention.getSummary.invalidate()
			]);
		}
	});
	const release = api.mentorAttention.release.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.mentorAttention.getQueue.invalidate(),
				utils.mentorAttention.getSummary.invalidate()
			]);
		}
	});
	const type = filters.type || 'all';
	const priority = filters.priority || 'all';
	const search = filters.search || undefined;

	const {
		data,
		isLoading,
		isError,
		refetch,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage
	} = api.mentorAttention.getQueue.useInfiniteQuery(
		{
			limit: 20,
			type: type as 'all' | (typeof queueTypes)[number][0],
			priority: priority as 'all' | (typeof queuePriorities)[number][0],
			search
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor
		}
	);

	const items = data?.pages.flatMap((page) => page.items) ?? [];

	const updateFilter = (key: 'type' | 'priority', value: string) => {
		void setFilters({ [key]: value });
	};

	const submitSearch = () => {
		void setFilters({ search: searchInput.trim() });
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl">Mentor attention queue</h1>
				<p className="mt-2 text-muted-foreground">
					One prioritized list for reviews, blocked work, learner activity, and
					mentorship follow-up.
				</p>
			</div>

			{summary.data && (
				<Card className="mb-6">
					<CardContent className="grid gap-4 p-5 md:grid-cols-3">
						<div className="flex items-center gap-3">
							<LockKeyhole className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-muted-foreground text-sm">My active load</p>
								<p className="font-semibold">
									{summary.data.capacity.active} / {summary.data.capacity.limit}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Timer className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-muted-foreground text-sm">First response</p>
								<p className="font-semibold">
									{minutesLabel(
										summary.data.metrics.averageFirstResponseMinutes
									)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<BarChart3 className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-muted-foreground text-sm">Completion time</p>
								<p className="font-semibold">
									{minutesLabel(summary.data.metrics.averageCompletionMinutes)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<Card className="mb-6">
				<CardHeader>
					<CardTitle level={2} className="text-lg">
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_180px]">
					<form
						className="relative"
						onSubmit={(event) => {
							event.preventDefault();
							submitSearch();
						}}
					>
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							placeholder="Search learner, project, track, or task"
							className="pl-9"
						/>
					</form>
					<Select
						value={type}
						onValueChange={(value) => updateFilter('type', value)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{queueTypes.map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={priority}
						onValueChange={(value) => updateFilter('priority', value)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{queuePriorities.map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-12 text-center text-muted-foreground">
							Loading attention queue...
						</div>
					) : isError ? (
						<div className="p-12 text-center">
							<AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
							<p className="text-muted-foreground">
								The attention queue could not be loaded.
							</p>
							<Button
								variant="outline"
								className="mt-4"
								onClick={() => void refetch()}
							>
								Try again
							</Button>
						</div>
					) : items.length === 0 ? (
						<div className="p-12 text-center">
							<Clock3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
							<h2 className="font-semibold">Nothing needs attention</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Try another filter or check back later.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Item</TableHead>
									<TableHead>Learner</TableHead>
									<TableHead>Age</TableHead>
									<TableHead>SLA</TableHead>
									<TableHead>Priority</TableHead>
									<TableHead>Owner</TableHead>
									<TableHead>Next action</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={`${item.type}-${item.id}`}>
										<TableCell>
											<div className="font-medium">{item.title}</div>
											<div className="text-muted-foreground text-sm">
												{item.context}
											</div>
										</TableCell>
										<TableCell>
											{item.learner
												? item.learner.name || item.learner.email
												: 'Unassigned'}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{ageLabel(item.ageInHours)}
										</TableCell>
										<TableCell>
											<Badge
												variant={item.isOverdue ? 'destructive' : 'outline'}
											>
												{item.isEscalated
													? 'Escalated'
													: item.isOverdue
														? 'Overdue'
														: `Due ${new Date(item.dueAt).toLocaleDateString()}`}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={priorityVariant(item.priority)}>
												{item.priority}
											</Badge>
										</TableCell>
										<TableCell>
											{item.assignedMentor ? (
												<span className="text-sm">
													{item.assignedMentor.name ||
														item.assignedMentor.email}
												</span>
											) : (
												<span className="text-muted-foreground text-sm">
													Unclaimed
												</span>
											)}
										</TableCell>
										<TableCell>{item.nextAction}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												{item.isAssignedToCurrentMentor ? (
													<Button
														variant="ghost"
														size="sm"
														disabled={release.isPending}
														onClick={() =>
															release.mutate({
																sourceType: item.type,
																sourceId: item.id
															})
														}
													>
														<Unlock className="mr-1 h-3.5 w-3.5" />
														Release
													</Button>
												) : !item.assignedMentor ? (
													<Button
														variant="secondary"
														size="sm"
														disabled={claim.isPending}
														onClick={() =>
															claim.mutate({
																sourceType: item.type,
																sourceId: item.id
															})
														}
													>
														<LockKeyhole className="mr-1 h-3.5 w-3.5" />
														Claim
													</Button>
												) : null}
												<Button asChild variant="outline" size="sm">
													<Link href={item.directUrl}>
														Open <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
													</Link>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{hasNextPage && (
				<div className="mt-6 text-center">
					<Button
						variant="outline"
						onClick={() => void fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? 'Loading...' : 'Load more'}
					</Button>
				</div>
			)}
		</div>
	);
}
