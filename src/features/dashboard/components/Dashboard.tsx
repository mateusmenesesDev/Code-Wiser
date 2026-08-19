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
			<Skeleton className="h-24 bg-[#171d28]" />
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				{[1, 2, 3, 4, 5].map((id) => (
					<Skeleton key={id} className="h-32 bg-[#171d28]" />
				))}
			</div>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
				<Skeleton className="h-[420px] bg-[#171d28]" />
				<Skeleton className="h-[420px] bg-[#171d28]" />
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
		<Card className="border-[#2b3340] bg-[#171d28] text-[#f1f3f7] shadow-none">
			<CardContent className="p-4">
				<div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#222a38]">
					<Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
				</div>
				<p className="font-semibold text-2xl tracking-tight">{value}</p>
				<p className="mt-1 text-sm">{label}</p>
				<p className="mt-1 truncate text-[#8793aa] text-xs">{meta}</p>
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
		href: string;
		priority: 'critical' | 'high' | 'medium';
		priorityLabel: string;
	}> = [];

	if (overview.urgentTask?.project) {
		recommendedActions.push({
			icon: Code2,
			title: `${t('actions.finish')} ${overview.urgentTask.title}`,
			description: overview.urgentTask.project.title,
			href: `/workspace/${overview.urgentTask.project.id}?taskId=${overview.urgentTask.id}`,
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
			href: `/workspace/${overview.activeReview.task.project.id}?taskId=${overview.activeReview.task.id}`,
			priority: 'high',
			priorityLabel: t('priority.high')
		});
	}
	if (overview.exercise) {
		recommendedActions.push({
			icon: BookOpen,
			title: `${t('actions.continue')} ${overview.exercise.challenge.title}`,
			description: overview.exercise.challenge.track.name,
			href: `/exercises/${overview.exercise.challenge.track.slug}/${overview.exercise.challenge.slug}`,
			priority: 'medium',
			priorityLabel: t('priority.medium')
		});
	}
	if (overview.booking) {
		recommendedActions.push({
			icon: CalendarClock,
			title: t('actions.prepareMentoring'),
			description: formatSession(overview.booking.scheduledAt, locale),
			href: '/mentorship',
			priority: 'medium',
			priorityLabel: t('priority.medium')
		});
	}
	if (recommendedActions.length === 0) {
		recommendedActions.push({
			icon: FolderKanban,
			title: t('actions.browseProjects'),
			description: t('actions.browseProjectsDescription'),
			href: '/projects',
			priority: 'medium',
			priorityLabel: t('priority.medium')
		});
	}

	return (
		<div className="mx-auto max-w-[1336px] space-y-7 text-[#f1f3f7]">
			<header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight sm:text-[28px]">
						{greeting}, {firstName}
					</h1>
					<p className="mt-1 text-[#8793aa] text-sm">
						{t('journeyDescription')}
					</p>
					{overview.viewedUser && (
						<Link
							href="/"
							className="mt-2 inline-block text-[#8588ff] text-xs underline-offset-4 hover:underline"
						>
							{t('returnToDashboard')}
						</Link>
					)}
				</div>
				<Button
					asChild
					className="h-10 rounded-lg bg-[#7b7eff] px-5 font-semibold text-[#10131c] hover:bg-[#9496ff]"
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
					iconClassName="text-[#888aff]"
				/>
				<StatCard
					icon={CheckCircle2}
					label={t('stats.completedProjects')}
					value={
						overview.projects.filter((item) => item.progress === 100).length
					}
					meta={t('stats.completedProjectsMeta')}
					iconClassName="text-[#27d47b]"
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
					iconClassName="text-[#1bb7f0]"
				/>
				<StatCard
					icon={GitPullRequest}
					label={t('stats.pendingReviews')}
					value={overview.activeReview ? 1 : 0}
					meta={reviewMeta}
					iconClassName="text-[#f0aa31]"
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
					iconClassName="text-[#9a8cff]"
				/>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
				<div className="space-y-8">
					<section>
						<Card className="border-[#2b3340] bg-[#171d28] text-[#f1f3f7] shadow-none">
							<CardContent className="p-5 sm:p-6">
								{project ? (
									<>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<div className="mb-3 flex flex-wrap items-center gap-2">
													<Badge className="border-transparent bg-[#063e5d] text-[#1eb7f1]">
														{t('project.inProgress')}
													</Badge>
													{currentSprint && (
														<Badge className="border-[#384255] bg-[#202733] text-[#9aa6bb]">
															{currentSprint.title}
														</Badge>
													)}
												</div>
												<h2 className="font-semibold text-lg tracking-tight">
													{project.title}
												</h2>
												<p className="mt-1 max-w-2xl text-[#8793aa] text-sm">
													{project.description}
												</p>
											</div>
											<div className="shrink-0 text-right">
												<p className="font-semibold text-2xl">
													{project.progress}%
												</p>
												<p className="text-[#8793aa] text-xs">
													{t('project.complete')}
												</p>
											</div>
										</div>
										<Progress
											value={project.progress}
											className="mt-6 h-1.5 bg-[#252d3b] [&>div]:bg-[#7b7eff]"
										/>
										<div className="mt-5 grid gap-4 border-[#2b3340] border-b pb-5 sm:grid-cols-3">
											<div>
												<p className="text-[#8793aa] text-xs">
													{t('project.tasksDone')}
												</p>
												<p className="mt-1 text-sm">
													{project.completedTasks ?? 0} /{' '}
													{project.totalTasks ?? 0}
												</p>
											</div>
											<div>
												<p className="text-[#8793aa] text-xs">
													{t('project.milestones')}
												</p>
												<p className="mt-1 text-sm">
													{project.completedMilestones ?? 0} /{' '}
													{project.totalMilestones ?? 0}
												</p>
											</div>
											<div>
												<p className="text-[#8793aa] text-xs">
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
												className="bg-[#7b7eff] text-[#10131c] hover:bg-[#9496ff]"
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
												className="border-[#384255] bg-transparent text-[#f1f3f7] hover:bg-[#202733] hover:text-white"
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
										<p className="mt-2 text-[#8793aa] text-sm">
											{t('project.noProjectDescription')}
										</p>
										<Button
											asChild
											className="mt-5 bg-[#7b7eff] text-[#10131c] hover:bg-[#9496ff]"
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
							<h2 className="font-semibold text-base">
								{t('recommendedNextActions')}
							</h2>
							<p className="mt-1 text-[#8793aa] text-sm">
								{t('recommendedDescription')}
							</p>
						</div>
						<div className="space-y-2">
							{recommendedActions.map((action) => {
								const Icon = action.icon;
								const tone =
									action.priority === 'critical'
										? 'border-[#633538] bg-[#351e27] text-[#f25e51]'
										: action.priority === 'high'
											? 'border-[#604b1e] bg-[#382c13] text-[#f0ad2d]'
											: 'border-[#244761] bg-[#14334a] text-[#23a9e1]';
								return (
									<Link
										key={action.href + action.title}
										href={action.href}
										className="group flex items-center gap-3 rounded-2xl border border-[#2b3340] bg-[#171d28] p-4 transition-colors hover:border-[#4a556b]"
									>
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#222a38] text-[#9aa6bb]">
											<Icon className="h-4 w-4" aria-hidden="true" />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate font-medium text-sm">
												{action.title}
											</span>
											<span className="mt-1 block truncate text-[#8793aa] text-xs">
												{action.description}
											</span>
											<span className="mt-2 flex items-center gap-2">
												<Badge className={`${tone} border text-[10px]`}>
													{action.priorityLabel}
												</Badge>
											</span>
										</span>
										<ArrowRight
											className="h-4 w-4 shrink-0 text-[#8793aa] transition-transform group-hover:translate-x-1"
											aria-hidden="true"
										/>
									</Link>
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
						<Card className="border-[#2b3340] bg-[#171d28] text-[#f1f3f7] shadow-none">
							<CardContent className="p-5">
								{overview.booking ? (
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222a38] font-semibold text-sm">
												{t('mentorshipInitials')}
											</div>
											<div>
												<p className="font-medium">{t('mentorshipTitle')}</p>
												<p className="text-[#8793aa] text-xs">
													{t('mentorshipSubtitle')}
												</p>
											</div>
										</div>
										<div className="rounded-xl border border-[#384255] bg-[#1c232f] p-3">
											<div className="flex items-center gap-2 font-medium text-sm">
												<CalendarClock
													className="h-4 w-4 text-[#8b8eff]"
													aria-hidden="true"
												/>
												{formatSession(overview.booking.scheduledAt, locale)}
											</div>
											<p className="mt-2 flex items-center gap-2 text-[#8793aa] text-sm">
												<Clock3 className="h-4 w-4" aria-hidden="true" />
												{t('mentorshipDuration')}
											</p>
										</div>
										<p className="text-sm">{t('mentorshipDescription')}</p>
										<Badge className="border-transparent bg-[#073e2c] text-[#21d47b]">
											{t('confirmed')}
										</Badge>
										<Button
											asChild
											variant="outline"
											className="w-full border-[#384255] bg-transparent text-[#f1f3f7] hover:bg-[#202733] hover:text-white"
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
										<p className="mt-1 text-[#8793aa] text-sm">
											{t('mentorshipEmptyDescription')}
										</p>
										<Button
											asChild
											className="mt-4 bg-[#7b7eff] text-[#10131c] hover:bg-[#9496ff]"
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
						<Card className="border-[#2b3340] bg-[#171d28] text-[#f1f3f7] shadow-none">
							<CardContent className="p-5">
								{overview.notifications.length > 0 ? (
									<div className="space-y-5">
										{overview.notifications.map((notification) => {
											const content = (
												<div key={notification.id} className="flex gap-3">
													<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#222a38] text-[#8b8eff]">
														<CircleDot
															className="h-3.5 w-3.5"
															aria-hidden="true"
														/>
													</span>
													<span className="min-w-0">
														<span className="block font-medium text-sm">
															{notification.title}
														</span>
														<span className="mt-1 block text-[#8793aa] text-xs">
															{notification.message}
														</span>
														<span className="mt-1 block text-[#718096] text-[11px]">
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
													className="block rounded-lg hover:bg-[#202733]"
												>
													{content}
												</Link>
											) : (
												<div key={notification.id}>{content}</div>
											);
										})}
									</div>
								) : (
									<div className="py-5 text-[#8793aa] text-sm">
										<CheckCircle2
											className="mb-2 h-5 w-5 text-[#27d47b]"
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
			<Card className="border-[#2b3340] bg-[#171d28] text-[#f1f3f7]">
				<CardContent className="space-y-3 py-12">
					<CircleDot className="h-8 w-8 text-[#f25e51]" />
					<h2 className="font-semibold text-lg">{t('dashboardUnavailable')}</h2>
					<p className="text-[#8793aa] text-sm">
						{t('dashboardUnavailableDescription')}
					</p>
				</CardContent>
			</Card>
		);
	return <DashboardContent overview={data} />;
}
