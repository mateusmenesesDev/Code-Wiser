'use client';

import { AlertCircle, Bell, CalendarDays, Clock3, Filter } from 'lucide-react';
import Link from 'next/link';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Label } from '~/common/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Skeleton } from '~/common/components/ui/skeleton';
import { Switch } from '~/common/components/ui/switch';
import { type RouterOutputs, api } from '~/trpc/react';
import type { AgendaPeriod } from '../schemas/agenda.schema';

const PERIODS: Array<{ value: AgendaPeriod; label: string }> = [
	{ value: 'today', label: 'Today' },
	{ value: 'upcoming', label: 'Next 7 days' },
	{ value: 'overdue', label: 'Overdue' }
];

function localCalendarDate() {
	const date = new Date();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

function isAgendaPeriod(value: string | null): value is AgendaPeriod {
	return value === 'today' || value === 'upcoming' || value === 'overdue';
}

function formatDueDate(date: Date | null) {
	if (!date) return 'No due date';

	return new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	}).format(new Date(date));
}

function statusLabel(status: string | null) {
	return status
		?.toLowerCase()
		.replaceAll('_', ' ')
		.replace(/(^| )\w/g, (letter) => letter.toUpperCase());
}

type AgendaOverview = RouterOutputs['agenda']['getOverview'];
type AgendaTask = AgendaOverview['tasks'][number];

function AgendaTaskRow({ task }: { task: AgendaTask }) {
	return (
		<div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-medium">{task.title}</p>
					{task.priority && <Badge variant="outline">{task.priority}</Badge>}
					{task.status && (
						<Badge variant="secondary">{statusLabel(task.status)}</Badge>
					)}
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
					<span>{task.project?.title ?? 'Project'}</span>
					{task.sprint && <span>Sprint: {task.sprint.title}</span>}
					{task.assignees.length > 0 && (
						<span>
							Assigned to{' '}
							{task.assignees
								.slice(0, 2)
								.map((assignee) => assignee.name ?? assignee.email)
								.join(', ')}
							{task.assignees.length > 2
								? ` +${task.assignees.length - 2}`
								: ''}
						</span>
					)}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-3">
				<span className="flex items-center gap-1 text-muted-foreground text-sm">
					<Clock3 className="h-4 w-4" />
					{formatDueDate(task.dueDate)}
				</span>
				<Button asChild variant="outline" size="sm">
					<Link href={`/workspace/${task.projectId}?taskId=${task.id}`}>
						Open task
					</Link>
				</Button>
			</div>
		</div>
	);
}

function AgendaLoading() {
	return (
		<div className="space-y-3" aria-live="polite" aria-busy="true">
			{[1, 2, 3].map((item) => (
				<Skeleton key={item} className="h-24 w-full" />
			))}
		</div>
	);
}

export default function AgendaPage() {
	const [{ period: rawPeriod, projectId, sprintId, assigneeId }, setFilters] =
		useQueryStates({
			period: parseAsString,
			projectId: parseAsString,
			sprintId: parseAsString,
			assigneeId: parseAsString
		});
	const period = isAgendaPeriod(rawPeriod) ? rawPeriod : 'today';
	const date = useMemo(localCalendarDate, []);
	const utils = api.useUtils();
	const { data, isLoading, isFetching, error } =
		api.agenda.getOverview.useQuery({
			period,
			date,
			projectId: projectId ?? undefined,
			sprintId: sprintId ?? undefined,
			assigneeId: assigneeId ?? undefined
		});
	const preferenceMutation = api.agenda.updateReminderPreference.useMutation({
		onSuccess: () => {
			void utils.agenda.getOverview.invalidate();
		},
		onError: (mutationError) => toast.error(mutationError.message)
	});

	const visibleSprints = data?.sprints.filter(
		(sprint) => !projectId || sprint.projectId === projectId
	);

	const setPeriod = (nextPeriod: AgendaPeriod) => {
		void setFilters({ period: nextPeriod });
	};
	const setFilter = (key: 'sprintId' | 'assigneeId', value: string) => {
		void setFilters({ [key]: value === 'all' ? null : value });
	};
	const setProject = (value: string) => {
		void setFilters({
			projectId: value === 'all' ? null : value,
			sprintId: null
		});
	};

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<div>
				<h1 className="font-bold text-3xl text-foreground">Task agenda</h1>
				<p className="mt-2 text-muted-foreground">
					See what is due, what is late, and what to work on next.
				</p>
			</div>

			<Card>
				<CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
					<div className="flex-1 space-y-2">
						<Label htmlFor="agenda-project">Project</Label>
						<Select value={projectId ?? 'all'} onValueChange={setProject}>
							<SelectTrigger id="agenda-project" aria-label="Filter by project">
								<SelectValue placeholder="All projects" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All projects</SelectItem>
								{data?.projects.map((project) => (
									<SelectItem key={project.id} value={project.id}>
										{project.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex-1 space-y-2">
						<Label htmlFor="agenda-sprint">Sprint</Label>
						<Select
							value={sprintId ?? 'all'}
							onValueChange={(value) => setFilter('sprintId', value)}
						>
							<SelectTrigger id="agenda-sprint" aria-label="Filter by sprint">
								<SelectValue placeholder="All sprints" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All sprints</SelectItem>
								{visibleSprints?.map((sprint) => (
									<SelectItem key={sprint.id} value={sprint.id}>
										{sprint.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex-1 space-y-2">
						<Label htmlFor="agenda-assignee">Responsible</Label>
						<Select
							value={assigneeId ?? 'all'}
							onValueChange={(value) => setFilter('assigneeId', value)}
						>
							<SelectTrigger
								id="agenda-assignee"
								aria-label="Filter by responsible person"
							>
								<SelectValue placeholder="Everyone" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Everyone</SelectItem>
								{data?.assignees.map((assignee) => (
									<SelectItem key={assignee.id} value={assignee.id}>
										{assignee.name ?? assignee.email}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Filter
						className="hidden h-5 w-5 text-muted-foreground lg:block"
						aria-hidden="true"
					/>
				</CardContent>
			</Card>

			<div className="grid gap-3 sm:grid-cols-3">
				{PERIODS.map((item) => (
					<Button
						key={item.value}
						variant={period === item.value ? 'default' : 'outline'}
						onClick={() => setPeriod(item.value)}
						className="h-12"
					>
						{item.label}
					</Button>
				))}
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div>
							<CardTitle level={2} className="flex items-center gap-2 text-lg">
								<CalendarDays className="h-5 w-5" />
								{PERIODS.find((item) => item.value === period)?.label}
							</CardTitle>
							<CardDescription>
								{isFetching
									? 'Updating tasks…'
									: `${data?.tasks.length ?? 0} task${data?.tasks.length === 1 ? '' : 's'}`}
							</CardDescription>
						</div>
						{period === 'overdue' && (
							<AlertCircle className="h-5 w-5 text-destructive" />
						)}
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<AgendaLoading />
					) : error ? (
						<div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
							We could not load your agenda. Refresh the page to try again.
						</div>
					) : data?.tasks.length ? (
						<div className="space-y-3">
							{data.tasks.map((task) => (
								<AgendaTaskRow key={task.id} task={task} />
							))}
							{data.hasMoreTasks && (
								<p className="text-muted-foreground text-sm">
									More tasks match these filters. Narrow the project, sprint, or
									responsible-person filters to see them.
								</p>
							)}
						</div>
					) : (
						<div className="py-10 text-center">
							<CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
							<p className="font-medium">Nothing here</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{period === 'overdue'
									? 'You have no overdue open tasks.'
									: 'You have no open tasks due in this period.'}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-3">
						<Bell className="mt-0.5 h-5 w-5 text-muted-foreground" />
						<div>
							<p className="font-medium">Deadline reminders</p>
							<p className="mt-1 text-muted-foreground text-sm">
								Get one quiet notification when an assigned task is due or
								becomes overdue.
							</p>
						</div>
					</div>
					<Switch
						checked={data?.remindersEnabled ?? true}
						disabled={!data || preferenceMutation.isPending}
						onCheckedChange={(enabled) =>
							preferenceMutation.mutate({ enabled })
						}
						aria-label="Enable deadline reminders"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
