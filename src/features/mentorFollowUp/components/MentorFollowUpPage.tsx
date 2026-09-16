'use client';

import {
	AlertCircle,
	ArrowRight,
	CalendarClock,
	CheckCircle2,
	Clock3,
	FolderKanban,
	GitPullRequest,
	Search,
	Timer
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import { Progress } from '~/common/components/ui/progress';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import type { RouterOutputs } from '~/trpc/react';
import { api } from '~/trpc/react';

type FollowUpOverview = RouterOutputs['mentorFollowUp']['getOverview'];
type Mentorando = FollowUpOverview['mentorandos'][number];
type PendingItem = Mentorando['pendingItems'][number];

function formatDate(date: Date, locale: string) {
	return new Date(date).toLocaleDateString(locale, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

function formatSession(date: Date, locale: string) {
	return new Date(date).toLocaleString(locale, {
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit'
	});
}

function itemLabel(item: PendingItem, t: ReturnType<typeof useTranslations>) {
	if (item.type === 'PR_REVIEW') return t('pullRequestReview');
	if (item.type === 'OVERDUE_SPRINT') return t('overdueSprint');
	return t('overdueTask');
}

function itemIcon(item: PendingItem) {
	return item.type === 'PR_REVIEW' ? GitPullRequest : Timer;
}

function FollowUpSkeleton() {
	return (
		<div className="space-y-6" aria-live="polite" aria-busy="true">
			<div className="space-y-2">
				<div className="h-8 w-64 animate-pulse rounded bg-muted" />
				<div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
			</div>
			<div className="h-12 animate-pulse rounded-xl bg-muted" />
			<div className="grid gap-4 xl:grid-cols-2">
				{[1, 2].map((id) => (
					<div key={id} className="h-72 animate-pulse rounded-xl bg-muted" />
				))}
			</div>
		</div>
	);
}

function PendingItemLink({
	item,
	locale,
	t
}: {
	item: PendingItem;
	locale: string;
	t: ReturnType<typeof useTranslations>;
}) {
	const Icon = itemIcon(item);
	return (
		<Link
			href={item.href}
			className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
		>
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-warning-foreground">
				<Icon className="h-4 w-4" aria-hidden="true" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="flex flex-wrap items-center gap-2">
					<span className="font-medium text-sm">{item.title}</span>
					<Badge variant="outline" className="text-[11px]">
						{itemLabel(item, t)}
					</Badge>
				</span>
				<span className="mt-1 block text-muted-foreground text-xs">
					{item.projectTitle} · {item.context}
				</span>
				<span className="mt-2 block text-destructive text-xs">
					{item.type === 'PR_REVIEW'
						? `${t('pending')} · ${formatDate(item.occurredAt, locale)}`
						: `${t('overdue')} · ${formatDate(item.occurredAt, locale)}`}
				</span>
			</span>
			<ArrowRight
				className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
				aria-hidden="true"
			/>
		</Link>
	);
}

function ProjectSummary({
	project,
	locale,
	t
}: {
	project: Mentorando['projects'][number];
	locale: string;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<div className="rounded-xl border border-border bg-muted/40 p-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">{project.title}</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{t('tasksComplete', {
							completed: project.completedTasks,
							total: project.totalTasks
						})}
					</p>
				</div>
				<span className="font-semibold text-sm">{project.progress}%</span>
			</div>
			<Progress value={project.progress} className="mt-3 h-1.5" />
			<p className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
				<Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
				{t('lastActivity')}:{' '}
				{project.lastActivityAt
					? formatDate(project.lastActivityAt, locale)
					: t('noActivity')}
			</p>
		</div>
	);
}

function MentorandoCard({
	mentorando,
	locale,
	t
}: {
	mentorando: Mentorando;
	locale: string;
	t: ReturnType<typeof useTranslations>;
}) {
	const displayName = mentorando.learner.name || mentorando.learner.email;
	return (
		<Card className="shadow-none">
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
							{displayName.charAt(0).toUpperCase()}
						</div>
						<div className="min-w-0">
							<CardTitle level={2} className="truncate text-base">
								{displayName}
							</CardTitle>
							<p className="truncate text-muted-foreground text-xs">
								{mentorando.learner.email}
							</p>
						</div>
					</div>
					<Badge variant="outline">
						{mentorando.pendingItems.length} {t('pending')}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-3">
					{mentorando.projects.map((project) => (
						<ProjectSummary
							key={project.id}
							project={project}
							locale={locale}
							t={t}
						/>
					))}
				</div>

				<div className="rounded-xl border border-border p-3">
					<div className="flex items-center gap-2 font-medium text-sm">
						<CalendarClock
							className="h-4 w-4 text-primary"
							aria-hidden="true"
						/>
						{t('nextSession')}
					</div>
					{mentorando.nextSession ? (
						<div className="mt-2 text-sm">
							<p>{formatSession(mentorando.nextSession.scheduledAt, locale)}</p>
							{mentorando.nextSession.objective && (
								<p className="mt-1 text-muted-foreground text-xs">
									{t('sessionObjective', {
										objective: mentorando.nextSession.objective
									})}
								</p>
							)}
						</div>
					) : (
						<p className="mt-2 text-muted-foreground text-sm">
							{t('noUpcomingSession')}
						</p>
					)}
				</div>

				<div>
					<h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
						<Timer
							className="h-4 w-4 text-warning-foreground"
							aria-hidden="true"
						/>
						{t('pending')}
					</h3>
					{mentorando.pendingItems.length > 0 ? (
						<div className="space-y-2">
							{mentorando.pendingItems.map((item) => (
								<PendingItemLink
									key={`${item.type}-${item.id}`}
									item={item}
									locale={locale}
									t={t}
								/>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">{t('noPending')}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function MentorFollowUpPage({
	initialData
}: {
	initialData?: FollowUpOverview;
}) {
	const t = useTranslations('mentorFollowUp');
	const locale = useLocale();
	const [search, setSearch] = useState('');
	const [projectId, setProjectId] = useState('all');
	const { data, isLoading, isError, refetch } =
		api.mentorFollowUp.getOverview.useQuery(undefined, { initialData });

	const visible = useMemo(() => {
		if (!data) return null;
		const normalizedSearch = search.trim().toLocaleLowerCase();
		const mentorandos = data.mentorandos
			.map((mentorando) => ({
				...mentorando,
				projects:
					projectId === 'all'
						? mentorando.projects
						: mentorando.projects.filter((project) => project.id === projectId),
				pendingItems:
					projectId === 'all'
						? mentorando.pendingItems
						: mentorando.pendingItems.filter(
								(item) => item.projectId === projectId
							)
			}))
			.filter((mentorando) => {
				const matchesSearch = normalizedSearch
					? `${mentorando.learner.name ?? ''} ${mentorando.learner.email}`
							.toLocaleLowerCase()
							.includes(normalizedSearch)
					: true;
				return matchesSearch && mentorando.projects.length > 0;
			});
		const visibleProjectIds = new Set(
			mentorandos.flatMap((mentorando) =>
				mentorando.projects.map((project) => project.id)
			)
		);
		const projectPendingItems = data.projectPendingItems.filter(
			(group) =>
				(projectId === 'all' || group.project?.id === projectId) &&
				(!normalizedSearch ||
					(group.project?.id !== undefined &&
						visibleProjectIds.has(group.project.id)))
		);
		return { mentorandos, projectPendingItems };
	}, [data, projectId, search]);

	if (isLoading && !data) return <FollowUpSkeleton />;
	if (isError || !data) {
		return (
			<Card className="shadow-none">
				<CardContent className="space-y-3 py-12 text-center">
					<AlertCircle className="mx-auto h-8 w-8 text-destructive" />
					<h1 className="font-semibold text-lg">{t('unavailable')}</h1>
					<p className="text-muted-foreground text-sm">
						{t('unavailableDescription')}
					</p>
					<Button variant="outline" onClick={() => void refetch()}>
						{t('tryAgain')}
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="mx-auto max-w-[1336px] space-y-7 text-foreground">
			<header>
				<h1 className="font-semibold text-2xl tracking-tight sm:text-[28px]">
					{t('title')}
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">{t('description')}</p>
			</header>

			<Card className="shadow-none">
				<CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_240px]">
					<label htmlFor="mentor-follow-up-search" className="relative">
						<span className="sr-only">{t('searchPlaceholder')}</span>
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							id="mentor-follow-up-search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder={t('searchPlaceholder')}
							className="pl-9"
						/>
					</label>
					<Select value={projectId} onValueChange={setProjectId}>
						<SelectTrigger aria-label={t('projectFilter')}>
							<SelectValue placeholder={t('projectFilter')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('projectFilter')}</SelectItem>
							{data.projects.map((project) => (
								<SelectItem key={project.id} value={project.id}>
									{project.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{data.hasMore && (
				<div className="rounded-lg border border-warning-border bg-warning-muted px-4 py-3 text-sm text-warning-foreground">
					{t('truncated')}
				</div>
			)}

			{visible &&
			visible.mentorandos.length === 0 &&
			visible.projectPendingItems.length === 0 ? (
				<Card className="shadow-none">
					<CardContent className="py-14 text-center">
						<CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-success" />
						<h2 className="font-semibold text-lg">{t('empty')}</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							{t('emptyDescription')}
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					<div className="grid gap-5 xl:grid-cols-2">
						{visible?.mentorandos.map((mentorando) => (
							<MentorandoCard
								key={mentorando.learner.id}
								mentorando={mentorando}
								locale={locale}
								t={t}
							/>
						))}
					</div>
					{visible && visible.projectPendingItems.length > 0 && (
						<section className="space-y-3">
							<h2 className="flex items-center gap-2 font-semibold text-base">
								<FolderKanban
									className="h-4 w-4 text-primary"
									aria-hidden="true"
								/>
								{t('projectItems')}
							</h2>
							<div className="grid gap-5 xl:grid-cols-2">
								{visible.projectPendingItems.map((group) => (
									<Card key={group.project?.id} className="shadow-none">
										<CardHeader className="pb-3">
											<CardTitle level={2} className="text-base">
												{group.project?.title}
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-2">
											{group.pendingItems.map((item) => (
												<PendingItemLink
													key={`${item.type}-${item.id}`}
													item={item}
													locale={locale}
													t={t}
												/>
											))}
										</CardContent>
									</Card>
								))}
							</div>
						</section>
					)}
				</>
			)}
		</div>
	);
}
