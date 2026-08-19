'use client';

import { useUser } from '@clerk/nextjs';
import {
	ArrowRight,
	BookOpen,
	CalendarClock,
	CheckCircle2,
	CircleDot,
	Clock3,
	Code2,
	FolderKanban,
	GitPullRequest,
	MessageSquare,
	Play,
	Timer,
	Video
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { Skeleton } from '~/common/components/ui/skeleton';
import { api } from '~/trpc/react';
import { type DashboardOverview, getNextAction } from '../utils/nextAction';

function formatSession(date: Date, locale: string) {
	return new Date(date).toLocaleString(locale, {
		weekday: 'long',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

function formatShortSession(date: Date, locale: string) {
	return new Date(date).toLocaleString(locale, {
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit'
	});
}

function formatActivity(
	date: string | Date | null,
	locale: string,
	empty: string
) {
	return date
		? new Date(date).toLocaleDateString(locale, {
				month: 'short',
				day: 'numeric'
			})
		: empty;
}

function DashboardSkeleton() {
	return (
		<div className="space-y-6" aria-live="polite" aria-busy="true">
			<Skeleton className="h-24 bg-muted" />
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				{[1, 2, 3, 4, 5].map((id) => (
					<Skeleton key={id} className="h-32 bg-muted" />
				))}
			</div>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
				<Skeleton className="h-[420px] bg-muted" />
				<Skeleton className="h-[420px] bg-muted" />
			</div>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	meta,
	iconClassName
}: {
	icon: LucideIcon;
	label: string;
	value: string | number;
	meta: string;
	iconClassName: string;
}) {
	return (
		<Card className="shadow-none">
			<CardContent className="p-4">
				<div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
					<Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
				</div>
				<p className="font-semibold text-2xl tracking-tight">{value}</p>
				<p className="mt-1 text-sm">{label}</p>
				<p className="mt-1 truncate text-muted-foreground text-xs">{meta}</p>
			</CardContent>
		</Card>
	);
}

function DashboardContent({ overview }: { overview: DashboardOverview }) {
	const t = useTranslations('dashboard');
	const locale = useLocale();
	const { user } = useUser();
	const nextAction = getNextAction(overview);
	const project = overview.projects[0];
	const currentSprint = overview.currentSprint;
	const firstName =
		overview.viewedUser?.name?.split(' ')[0] ??
		user?.firstName ??
		user?.fullName?.split(' ')[0] ??
		t('defaultName');
	const hour = new Date().getHours();
	const greeting =
		hour < 12
			? t('greeting.morning')
			: hour < 18
				? t('greeting.afternoon')
				: t('greeting.evening');
	const sprintDaysLeft = currentSprint?.endDate
		? Math.max(
				0,
				Math.ceil(
					(new Date(currentSprint.endDate).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24)
				)
			)
		: null;
	const reviewMeta = overview.activeReview
		? overview.activeReview.status === 'CHANGES_REQUESTED'
			? t('changesRequested')
			: t('waitingForReview')
		: t('stats.noPendingReviews');
	const recommendedActions: Array<{
		icon: LucideIcon;
		title: string;
		description: string;
		priority: 'critical' | 'high' | 'medium';
		priorityLabel: string;
	}> = [];

	if (overview.urgentTask?.project) {
		recommendedActions.push({
			icon: Code2,
			title: `${t('actions.finish')} ${overview.urgentTask.title}`,
			description: overview.urgentTask.project.title,
			priority:
				overview.urgentTask.priority === 'HIGH' ||
				overview.urgentTask.priority === 'HIGHEST'
					? 'critical'
					: overview.urgentTask.priority === 'MEDIUM'
						? 'high'
						: 'medium',
			priorityLabel:
				overview.urgentTask.priority === 'HIGH' ||
				overview.urgentTask.priority === 'HIGHEST'
					? t('priority.critical')
					: overview.urgentTask.priority === 'MEDIUM'
						? t('priority.high')
						: t('priority.medium')
		});
	}
	if (overview.activeReview?.task.project) {
		recommendedActions.push({
			icon: MessageSquare,
			title: `${t('actions.review')} ${overview.activeReview.task.title}`,
			description: t('actions.reviewDescription'),
			priority: 'high',
			priorityLabel: t('priority.high')
		});
	}
	if (overview.exercise) {
		recommendedActions.push({
			icon: BookOpen,
			title: `${t('actions.continue')} ${overview.exercise.challenge.title}`,
			description: overview.exercise.challenge.track.name,
			priority: 'medium',
			priorityLabel: t('priority.medium')
		});
	}
	if (overview.booking) {
		recommendedActions.push({
			icon: CalendarClock,
			title: t('actions.prepareMentoring'),
			description: formatSession(overview.booking.scheduledAt, locale),
			priority: 'medium',
			priorityLabel: t('priority.medium')
		});
	}
	if (recommendedActions.length === 0) {
		recommendedActions.push({
			icon: FolderKanban,
			title: t('actions.browseProjects'),
			description: t('actions.browseProjectsDescription'),
			priority: 'medium',
			priorityLabel: t('priority.medium')
		});
	}

	return (
		<div className="mx-auto max-w-[1336px] space-y-7 text-foreground">
			<header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight sm:text-[28px]">
						{greeting}, {firstName}
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{t('journeyDescription')}
					</p>
					{overview.viewedUser && (
						<Link
							href="/"
							className="mt-2 inline-block text-primary text-xs underline-offset-4 hover:underline"
						>
							{t('returnToDashboard')}
						</Link>
					)}
				</div>
				<Button
					asChild
					className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
				>
					<Link href={nextAction?.href ?? '/projects'}>
						<Play className="mr-2 h-4 w-4 fill-current" aria-hidden="true" />
						{t('continueProject')}
					</Link>
				</Button>
			</header>

			<section
				aria-label={t('overview')}
				className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
			>
				<StatCard
					icon={FolderKanban}
					label={t('stats.activeProjects')}
					value={overview.projects.length}
					meta={t('stats.activeProjectsMeta')}
					iconClassName="text-primary"
				/>
				<StatCard
					icon={CheckCircle2}
					label={t('stats.completedProjects')}
					value={
						overview.projects.filter((item) => item.progress === 100).length
					}
					meta={t('stats.completedProjectsMeta')}
					iconClassName="text-success"
				/>
				<StatCard
					icon={Timer}
					label={t('stats.currentSprint')}
					value={currentSprint?.title ?? '—'}
					meta={
						currentSprint
							? t('stats.sprintMeta', {
									days: sprintDaysLeft ?? 0,
									completed: currentSprint.completedPoints,
									total: currentSprint.totalPoints
								})
							: t('stats.noCurrentSprint')
					}
					iconClassName="text-info"
				/>
				<StatCard
					icon={GitPullRequest}
					label={t('stats.pendingReviews')}
					value={overview.activeReview ? 1 : 0}
					meta={reviewMeta}
					iconClassName="text-warning"
				/>
				<StatCard
					icon={CalendarClock}
					label={t('stats.nextMentoring')}
					value={
						overview.booking
							? formatShortSession(overview.booking.scheduledAt, locale)
							: '—'
					}
					meta={
						overview.booking ? t('stats.mentoringMeta') : t('stats.noMentoring')
					}
					iconClassName="text-epic"
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
				<div className="space-y-8">
					<section>
						<Card className="shadow-none">
							<CardContent className="p-5 sm:p-6">
								{project ? (
									<>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<div className="mb-3 flex flex-wrap items-center gap-2">
													<Badge className="border-transparent bg-info-muted text-info-muted-foreground">
														{t('project.inProgress')}
													</Badge>
													{currentSprint && (
														<Badge className="border-border bg-muted text-muted-foreground">
															{currentSprint.title}
														</Badge>
													)}
												</div>
												<h2 className="font-semibold text-lg tracking-tight">
													{project.title}
												</h2>
												<p className="mt-1 max-w-2xl text-muted-foreground text-sm">
													{project.description}
												</p>
											</div>
											<div className="shrink-0 text-right">
												<p className="font-semibold text-2xl">
													{project.progress}%
												</p>
												<p className="text-muted-foreground text-xs">
													{t('project.complete')}
												</p>
											</div>
										</div>
										<Progress
											value={project.progress}
											className="mt-6 h-1.5 bg-muted [&>div]:bg-primary"
										/>
										<div className="mt-5 grid gap-4 border-border border-b pb-5 sm:grid-cols-3">
											<div>
												<p className="text-muted-foreground text-xs">
													{t('project.tasksDone')}
												</p>
												<p className="mt-1 text-sm">
													{project.completedTasks ?? 0} /{' '}
													{project.totalTasks ?? 0}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground text-xs">
													{t('project.milestones')}
												</p>
												<p className="mt-1 text-sm">
													{project.completedMilestones ?? 0} /{' '}
													{project.totalMilestones ?? 0}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground text-xs">
													{t('project.lastActivity')}
												</p>
												<p className="mt-1 text-sm">
													{formatActivity(
														project.lastActivityAt ?? null,
														locale,
														t('project.noActivity')
													)}
												</p>
											</div>
										</div>
										<div className="mt-5 flex flex-wrap gap-2">
											<Button
												asChild
												className="bg-primary text-primary-foreground hover:bg-primary/90"
											>
												<Link href={`/workspace/${project.id}`}>
													{t('continueProject')}
													<ArrowRight
														className="ml-2 h-4 w-4"
														aria-hidden="true"
													/>
												</Link>
											</Button>
											<Button
												asChild
												variant="outline"
												className="border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
											>
												<Link href={`/workspace/${project.id}`}>
													{t('project.viewBacklog')}
												</Link>
											</Button>
										</div>
									</>
								) : (
									<div className="py-8">
										<h2 className="font-semibold text-lg">
											{t('project.noProject')}
										</h2>
										<p className="mt-2 text-muted-foreground text-sm">
											{t('project.noProjectDescription')}
										</p>
										<Button
											asChild
											className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
										>
											<Link href="/projects">
												{t('actions.browseProjects')}
											</Link>
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					</section>

					<section>
						<div className="mb-3">
							<div className="flex items-center gap-3">
								<h2 className="font-semibold text-base">
									{t('recommendedNextActions')}
								</h2>
								<Badge
									variant="outline"
									className="gap-1 border-info-border bg-info-muted text-info-muted-foreground"
								>
									<Clock3 className="h-3 w-3" aria-hidden="true" />
									{t('soon')}
								</Badge>
							</div>
							<p className="mt-1 text-muted-foreground text-sm">
								{t('recommendedDescription')}
							</p>
						</div>
						<div className="space-y-2">
							{recommendedActions.map((action) => {
								const Icon = action.icon;
								const tone =
									action.priority === 'critical'
										? 'border-destructive/30 bg-destructive/10 text-destructive'
										: action.priority === 'high'
											? 'border-warning-border bg-warning-muted text-warning-muted-foreground'
											: 'border-info-border bg-info-muted text-info-muted-foreground';
								return (
									<div
										key={action.title}
										className="flex items-center gap-3 rounded-2xl border border-border border-dashed bg-muted/50 p-4 opacity-75"
									>
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
											<Icon className="h-4 w-4" aria-hidden="true" />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate font-medium text-sm">
												{action.title}
											</span>
											<span className="mt-1 block truncate text-muted-foreground text-xs">
												{action.description}
											</span>
											<span className="mt-2 flex items-center gap-2">
												<Badge className={`${tone} border text-[10px]`}>
													{action.priorityLabel}
												</Badge>
											</span>
										</span>
										<span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
											<Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
											{t('soon')}
										</span>
									</div>
								);
							})}
						</div>
					</section>
				</div>

				<div className="space-y-8">
					<section>
						<h2 className="mb-3 font-semibold text-base">
							{t('upcomingMentorship')}
						</h2>
						<Card className="shadow-none">
							<CardContent className="p-5">
								{overview.booking ? (
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-sm">
												{t('mentorshipInitials')}
											</div>
											<div>
												<p className="font-medium">{t('mentorshipTitle')}</p>
												<p className="text-muted-foreground text-xs">
													{t('mentorshipSubtitle')}
												</p>
											</div>
										</div>
										<div className="rounded-xl border border-border bg-muted p-3">
											<div className="flex items-center gap-2 font-medium text-sm">
												<CalendarClock
													className="h-4 w-4 text-epic"
													aria-hidden="true"
												/>
												{formatSession(overview.booking.scheduledAt, locale)}
											</div>
											<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
												<Clock3 className="h-4 w-4" aria-hidden="true" />
												{t('mentorshipDuration')}
											</p>
										</div>
										<p className="text-sm">{t('mentorshipDescription')}</p>
										<Badge className="border-transparent bg-success-muted text-success-muted-foreground">
											{t('confirmed')}
										</Badge>
										<Button
											asChild
											variant="outline"
											className="w-full border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
										>
											<Link href="/mentorship">
												<Video className="mr-2 h-4 w-4" aria-hidden="true" />
												{t('viewSession')}
											</Link>
										</Button>
									</div>
								) : (
									<div className="py-5">
										<p className="font-medium">{t('noUpcomingSession')}</p>
										<p className="mt-1 text-muted-foreground text-sm">
											{t('mentorshipEmptyDescription')}
										</p>
										<Button
											asChild
											className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
										>
											<Link href="/mentorship">{t('bookSession')}</Link>
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					</section>

					<section>
						<h2 className="mb-3 font-semibold text-base">
							{t('recentActivity')}
						</h2>
						<Card className="shadow-none">
							<CardContent className="p-5">
								{overview.notifications.length > 0 ? (
									<div className="space-y-5">
										{overview.notifications.map((notification) => {
											const content = (
												<div key={notification.id} className="flex gap-3">
													<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-epic">
														<CircleDot
															className="h-3.5 w-3.5"
															aria-hidden="true"
														/>
													</span>
													<span className="min-w-0">
														<span className="block font-medium text-sm">
															{notification.title}
														</span>
														<span className="mt-1 block text-muted-foreground text-xs">
															{notification.message}
														</span>
														<span className="mt-1 block text-[11px] text-muted-foreground">
															{formatActivity(
																notification.createdAt,
																locale,
																''
															)}
														</span>
													</span>
												</div>
											);
											return notification.link ? (
												<Link
													key={notification.id}
													href={notification.link}
													className="block rounded-lg hover:bg-accent"
												>
													{content}
												</Link>
											) : (
												<div key={notification.id}>{content}</div>
											);
										})}
									</div>
								) : (
									<div className="py-5 text-muted-foreground text-sm">
										<CheckCircle2
											className="mb-2 h-5 w-5 text-success"
											aria-hidden="true"
										/>
										{t('allCaughtUp')}
									</div>
								)}
							</CardContent>
						</Card>
					</section>
				</div>
			</div>
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
			<Card className="shadow-none">
				<CardContent className="space-y-3 py-12">
					<CircleDot className="h-8 w-8 text-destructive" />
					<h2 className="font-semibold text-lg">{t('dashboardUnavailable')}</h2>
					<p className="text-muted-foreground text-sm">
						{t('dashboardUnavailableDescription')}
					</p>
				</CardContent>
			</Card>
		);
	return <DashboardContent overview={data} />;
}
