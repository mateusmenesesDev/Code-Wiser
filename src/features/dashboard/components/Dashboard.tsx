'use client';

import {
	AlertCircle,
	Bell,
	BookOpen,
	Calendar,
	CheckCircle2,
	Clock3,
	FolderOpen,
	GitPullRequest,
	Target
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { Skeleton } from '~/common/components/ui/skeleton';
import {
	PROGRESS_STATUS_LABELS,
	progressStatusBadgeVariant
} from '~/features/exercises/lib/progressStatus';
import { api } from '~/trpc/react';
import { type DashboardOverview, getNextAction } from '../utils/nextAction';

function formatDate(date: Date | null) {
	return date
		? new Date(date).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric'
			})
		: 'No due date';
}

function formatSession(date: Date) {
	return new Date(date).toLocaleString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

function DashboardSkeleton() {
	return (
		<div className="space-y-6" aria-live="polite" aria-busy="true">
			<Skeleton className="h-32" />
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-48" />
				<Skeleton className="h-48" />
			</div>
			<Skeleton className="h-56" />
		</div>
	);
}

function DashboardCard({
	icon: Icon,
	title,
	description,
	children
}: {
	icon: typeof Target;
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div>
						<CardTitle level={2} className="text-lg">
							{title}
						</CardTitle>
						<CardDescription>{description}</CardDescription>
					</div>
					<Icon className="h-5 w-5 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function DashboardContent({ overview }: { overview: DashboardOverview }) {
	const nextAction = getNextAction(overview);
	const task = overview.urgentTask;
	const exercise = overview.exercise;
	const review = overview.activeReview;
	const decision = overview.latestDecision;
	const overdue = task?.dueDate && new Date(task.dueDate) < new Date();

	return (
		<div className="space-y-6">
			{nextAction && (
				<Card className="border-primary/30 bg-primary/5">
					<CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<Target className="mt-1 h-5 w-5 shrink-0 text-primary" />
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Your next action
								</p>
								<h2 className="mt-1 font-semibold text-xl">
									{nextAction.title}
								</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									{nextAction.description}
								</p>
							</div>
						</div>
						<Button asChild className="shrink-0">
							<Link href={nextAction.href}>{nextAction.label}</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<DashboardCard
					icon={AlertCircle}
					title="Most urgent task"
					description="Work that needs your attention first"
				>
					{task?.project ? (
						<div className="space-y-3">
							<div>
								<p className="font-medium">{task.title}</p>
								<p className="text-muted-foreground text-sm">
									{task.project.title}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2 text-sm">
								<Badge variant="outline">{task.status ?? 'Backlog'}</Badge>
								<span
									className={
										overdue
											? 'font-medium text-destructive'
											: 'text-muted-foreground'
									}
								>
									<Clock3 className="mr-1 inline h-4 w-4" />
									{overdue ? 'Overdue · ' : 'Due · '}
									{formatDate(task.dueDate)}
								</span>
							</div>
							<Button asChild variant="outline" size="sm">
								<Link href={`/workspace/${task.project.id}?taskId=${task.id}`}>
									Open task
								</Link>
							</Button>
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							No open tasks in your projects.
						</p>
					)}
				</DashboardCard>

				<DashboardCard
					icon={BookOpen}
					title="Exercise progress"
					description="Pick up where you left off"
				>
					{exercise ? (
						<div className="space-y-3">
							<div>
								<p className="font-medium">{exercise.challenge.title}</p>
								<p className="text-muted-foreground text-sm">
									{exercise.challenge.track.name}
								</p>
							</div>
							<Badge variant={progressStatusBadgeVariant(exercise.status)}>
								{PROGRESS_STATUS_LABELS[exercise.status]}
							</Badge>
							<Button asChild variant="outline" size="sm">
								<Link
									href={`/exercises/${exercise.challenge.track.slug}/${exercise.challenge.slug}`}
								>
									Open exercise
								</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-muted-foreground text-sm">
								No exercise in progress.
							</p>
							<Button asChild variant="outline" size="sm">
								<Link href="/exercises">Browse exercises</Link>
							</Button>
						</div>
					)}
				</DashboardCard>

				<DashboardCard
					icon={GitPullRequest}
					title="Code review"
					description="Review status and latest feedback"
				>
					<div className="space-y-3">
						{review?.task.project && (
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-medium">{review.task.title}</p>
									<p className="text-muted-foreground text-sm">
										{review.task.project.title}
									</p>
								</div>
								<Badge
									variant={
										review.status === 'CHANGES_REQUESTED'
											? 'destructive'
											: 'warning'
									}
								>
									{review.status === 'CHANGES_REQUESTED'
										? 'Changes requested'
										: 'Waiting for review'}
								</Badge>
							</div>
						)}
						{decision?.task.project && (
							<div className="flex items-start gap-2 border-t pt-3 text-sm">
								{decision.status === 'APPROVED' ? (
									<CheckCircle2 className="h-4 w-4 text-success" />
								) : (
									<AlertCircle className="h-4 w-4 text-warning" />
								)}
								<p>
									<span className="font-medium">
										{decision.status === 'APPROVED'
											? 'Last review approved'
											: 'Last review requested changes'}
									</span>{' '}
									<span className="text-muted-foreground">
										{decision.task.title}
									</span>
								</p>
							</div>
						)}
						{!review && !decision && (
							<p className="text-muted-foreground text-sm">
								No project review activity yet.
							</p>
						)}
					</div>
				</DashboardCard>

				<DashboardCard
					icon={Calendar}
					title="Next mentorship session"
					description="Your upcoming one-on-one session"
				>
					{overview.booking ? (
						<div className="space-y-3">
							<p className="font-medium">
								{formatSession(overview.booking.scheduledAt)}
							</p>
							<Button asChild variant="outline" size="sm">
								<Link href="/mentorship">View mentorship</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-muted-foreground text-sm">
								No upcoming session scheduled.
							</p>
							<Button asChild variant="outline" size="sm">
								<Link href="/mentorship">Book a session</Link>
							</Button>
						</div>
					)}
				</DashboardCard>
			</div>

			<DashboardCard
				icon={FolderOpen}
				title="Active projects"
				description="Progress across your six most recent projects"
			>
				{overview.projects.length === 0 ? (
					<div className="space-y-3">
						<p className="text-muted-foreground text-sm">
							You have not started a project yet.
						</p>
						<Button asChild variant="outline" size="sm">
							<Link href="/projects">Browse projects</Link>
						</Button>
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{overview.projects.map((project) => (
							<div key={project.id} className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<Link
										href={`/workspace/${project.id}`}
										className="truncate font-medium hover:underline"
									>
										{project.title}
									</Link>
									<span className="text-muted-foreground text-sm">
										{project.progress}%
									</span>
								</div>
								<Progress value={project.progress} className="h-2" />
								<p className="text-muted-foreground text-xs">
									{project.usesRoadmap
										? `${project.completedMilestones} of ${project.totalMilestones} milestones complete`
										: `${project.completedTasks} of ${project.totalTasks} tasks complete`}
								</p>
							</div>
						))}
					</div>
				)}
			</DashboardCard>

			<DashboardCard
				icon={Bell}
				title="Relevant notifications"
				description="Unread updates that may need your attention"
			>
				{overview.notifications.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						You are all caught up.
					</p>
				) : (
					<div className="divide-y">
						{overview.notifications.map((notification) => {
							const content = (
								<div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
									<Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
									<div>
										<p className="font-medium text-sm">{notification.title}</p>
										<p className="text-muted-foreground text-sm">
											{notification.message}
										</p>
									</div>
								</div>
							);
							return (
								<div key={notification.id}>
									{notification.link ? (
										<Link
											href={notification.link}
											className="block rounded-md hover:bg-muted/50"
										>
											{content}
										</Link>
									) : (
										content
									)}
								</div>
							);
						})}
					</div>
				)}
			</DashboardCard>
		</div>
	);
}

export default function Dashboard({
	initialData,
	userId
}: {
	initialData?: DashboardOverview;
	userId?: string;
}) {
	const { data, isLoading } = api.dashboard.getOverview.useQuery(
		userId ? { userId } : undefined,
		{ initialData }
	);
	if (isLoading && !data) return <DashboardSkeleton />;
	if (!data)
		return (
			<Card>
				<CardContent className="space-y-3 py-12">
					<AlertCircle className="h-8 w-8 text-destructive" />
					<h2 className="font-semibold text-lg">Dashboard unavailable</h2>
					<p className="text-muted-foreground text-sm">
						We could not load your learning overview. Refresh the page to try
						again.
					</p>
				</CardContent>
			</Card>
		);
	return <DashboardContent overview={data} />;
}
