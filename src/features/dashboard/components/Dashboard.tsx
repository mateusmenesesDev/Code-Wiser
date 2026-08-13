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
import { useLocale, useTranslations } from 'next-intl';
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
import { progressStatusBadgeVariant } from '~/features/exercises/lib/progressStatus';
import { api } from '~/trpc/react';
import { type DashboardOverview, getNextAction } from '../utils/nextAction';

function formatDate(date: Date | null, locale: string, noDate: string) {
	return date
		? new Date(date).toLocaleDateString(locale, {
				month: 'short',
				day: 'numeric'
			})
		: noDate;
}

function formatSession(date: Date, locale: string) {
	return new Date(date).toLocaleString(locale, {
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
	const t = useTranslations('dashboard');
	const locale = useLocale();
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
									{t('yourNextAction')}
								</p>
								<h2 className="mt-1 font-semibold text-xl">
									{t(`nextAction.${nextAction.titleKey}`)}
								</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									{nextAction.descriptionKey
										? t(`nextAction.${nextAction.descriptionKey}`)
										: nextAction.description}
								</p>
							</div>
						</div>
						<Button asChild className="shrink-0">
							<Link href={nextAction.href}>
								{t(`nextAction.${nextAction.labelKey}`)}
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<DashboardCard
					icon={AlertCircle}
					title={t('mostUrgentTask')}
					description={t('urgentTaskDescription')}
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
								<Badge variant="outline">
									{task.status ? t(`taskStatus.${task.status}`) : t('backlog')}
								</Badge>
								<span
									className={
										overdue
											? 'font-medium text-destructive'
											: 'text-muted-foreground'
									}
								>
									<Clock3 className="mr-1 inline h-4 w-4" />
									{overdue ? `${t('overdue')} · ` : `${t('due')} · `}
									{formatDate(task.dueDate, locale, t('noDueDate'))}
								</span>
							</div>
							<Button asChild variant="outline" size="sm">
								<Link href={`/workspace/${task.project.id}?taskId=${task.id}`}>
									{t('nextAction.openTask')}
								</Link>
							</Button>
						</div>
					) : (
						<p className="text-muted-foreground text-sm">{t('noOpenTasks')}</p>
					)}
				</DashboardCard>

				<DashboardCard
					icon={BookOpen}
					title={t('exerciseProgress')}
					description={t('exerciseProgressDescription')}
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
								{t(`status.${exercise.status}`)}
							</Badge>
							<Button asChild variant="outline" size="sm">
								<Link
									href={`/exercises/${exercise.challenge.track.slug}/${exercise.challenge.slug}`}
								>
									{t('nextAction.openExercise')}
								</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-muted-foreground text-sm">{t('noExercise')}</p>
							<Button asChild variant="outline" size="sm">
								<Link href="/exercises">{t('browseExercises')}</Link>
							</Button>
						</div>
					)}
				</DashboardCard>

				<DashboardCard
					icon={GitPullRequest}
					title={t('codeReview')}
					description={t('codeReviewDescription')}
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
										? t('changesRequested')
										: t('waitingForReview')}
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
											? t('lastReviewApproved')
											: t('lastReviewChanges')}
									</span>{' '}
									<span className="text-muted-foreground">
										{decision.task.title}
									</span>
								</p>
							</div>
						)}
						{!review && !decision && (
							<p className="text-muted-foreground text-sm">
								{t('noReviewActivity')}
							</p>
						)}
					</div>
				</DashboardCard>

				<DashboardCard
					icon={Calendar}
					title={t('nextMentorshipSession')}
					description={t('nextMentorshipDescription')}
				>
					{overview.booking ? (
						<div className="space-y-3">
							<p className="font-medium">
								{formatSession(overview.booking.scheduledAt, locale)}
							</p>
							<Button asChild variant="outline" size="sm">
								<Link href="/mentorship">{t('viewMentorship')}</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-muted-foreground text-sm">
								{t('noUpcomingSession')}
							</p>
							<Button asChild variant="outline" size="sm">
								<Link href="/mentorship">{t('bookSession')}</Link>
							</Button>
						</div>
					)}
				</DashboardCard>
			</div>

			<DashboardCard
				icon={FolderOpen}
				title={t('activeProjects')}
				description={t('activeProjectsDescription')}
			>
				{overview.projects.length === 0 ? (
					<div className="space-y-3">
						<p className="text-muted-foreground text-sm">{t('noProject')}</p>
						<Button asChild variant="outline" size="sm">
							<Link href="/projects">{t('browseProjects')}</Link>
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
										? t('milestonesComplete', {
												completed: project.completedMilestones ?? 0,
												total: project.totalMilestones ?? 0
											})
										: t('tasksComplete', {
												completed: project.completedTasks ?? 0,
												total: project.totalTasks ?? 0
											})}
								</p>
							</div>
						))}
					</div>
				)}
			</DashboardCard>

			<DashboardCard
				icon={Bell}
				title={t('relevantNotifications')}
				description={t('relevantNotificationsDescription')}
			>
				{overview.notifications.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t('allCaughtUp')}</p>
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
	const t = useTranslations('dashboard');
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
					<h2 className="font-semibold text-lg">{t('dashboardUnavailable')}</h2>
					<p className="text-muted-foreground text-sm">
						{t('dashboardUnavailableDescription')}
					</p>
				</CardContent>
			</Card>
		);
	return <DashboardContent overview={data} />;
}
