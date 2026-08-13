'use client';

import {
	ChevronDown,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	ListFilter
} from 'lucide-react';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { useMemo, useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
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
import { getBadgeTaskPriorityColor } from '~/common/utils/colorUtils';
import { columns } from '~/features/kanban/constants';
import { formatPublicTaskId } from '~/lib/publicTaskId';
import {
	type ProjectListDirection,
	type ProjectListGroupBy,
	type ProjectListSort,
	type ProjectListSprint,
	type ProjectListTask,
	groupProjectListTasks,
	sortProjectListTasks,
	taskPriorityLabels,
	taskStatusLabels,
	taskTypeLabels
} from '../utils/projectListView';

const groupOptions: { value: ProjectListGroupBy; label: string }[] = [
	{ value: 'status', label: 'Status' },
	{ value: 'sprint', label: 'Sprint' },
	{ value: 'priority', label: 'Priority' }
];

const sortOptions: { value: ProjectListSort; label: string }[] = [
	{ value: 'manual', label: 'Manual order' },
	{ value: 'title', label: 'Title' },
	{ value: 'priority', label: 'Priority' }
];

const directionLabels: Record<ProjectListDirection, string> = {
	asc: 'Ascending',
	desc: 'Descending'
};

const statusColorByKey = new Map(
	columns.map((column) => [column.id, column.color] as const)
);

const isProjectListSort = (value: string): value is ProjectListSort =>
	sortOptions.some((option) => option.value === value);

const isProjectListDirection = (value: string): value is ProjectListDirection =>
	value === 'asc' || value === 'desc';

const initialsFor = (name: string | null) => {
	if (!name) return '?';
	return name
		.split(' ')
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join('')
		.toUpperCase();
};

type ProjectListViewProps = {
	tasks: ProjectListTask[];
	sprints: ProjectListSprint[];
};

const TaskRow = ({ task }: { task: ProjectListTask }) => {
	const [, setTaskId] = useQueryState('taskId', parseAsString);
	const publicTaskId = formatPublicTaskId(
		task.project?.publicCode,
		task.publicNumber
	);
	const statusLabel = task.status ? taskStatusLabels[task.status] : 'No status';
	const assigneeNames = (task.assignees ?? [])
		.map((assignee) => assignee.name)
		.filter(Boolean)
		.join(', ');

	const openTask = () => setTaskId(task.id);

	return (
		<TableRow
			tabIndex={0}
			role="button"
			aria-label={`Open task ${task.title}`}
			className="cursor-pointer focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
			onClick={openTask}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openTask();
				}
			}}
		>
			<TableCell className="w-28 whitespace-nowrap font-mono text-muted-foreground text-xs">
				{publicTaskId ?? '—'}
			</TableCell>
			<TableCell className="min-w-[240px] max-w-[360px] font-medium">
				<div className="truncate" title={task.title}>
					{task.title}
				</div>
			</TableCell>
			<TableCell className="whitespace-nowrap">
				{task.type ? (
					<Badge variant="secondary">{taskTypeLabels[task.type]}</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
			<TableCell className="whitespace-nowrap">
				<div className="flex items-center gap-2">
					{task.status && (
						<span
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: statusColorByKey.get(task.status) }}
						/>
					)}
					<span>{statusLabel}</span>
				</div>
			</TableCell>
			<TableCell className="whitespace-nowrap">
				{task.priority ? (
					<Badge variant={getBadgeTaskPriorityColor(task.priority)}>
						{taskPriorityLabels[task.priority]}
					</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
			<TableCell className="whitespace-nowrap">
				{task.assignees && task.assignees.length > 0 ? (
					<div
						className="-space-x-1 flex"
						aria-label={`Assignees: ${assigneeNames || 'Unknown'}`}
					>
						{task.assignees.slice(0, 3).map((assignee) => (
							<div
								key={assignee.id}
								className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs ring-2 ring-background"
								title={assignee.name ?? 'Unknown assignee'}
							>
								{initialsFor(assignee.name)}
							</div>
						))}
						{task.assignees.length > 3 && (
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs ring-2 ring-background">
								+{task.assignees.length - 3}
							</div>
						)}
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
			<TableCell className="max-w-[220px] truncate" title={task.sprint?.title}>
				{task.sprint?.title ?? 'No sprint'}
			</TableCell>
		</TableRow>
	);
};

export default function ProjectListView({
	tasks,
	sprints
}: ProjectListViewProps) {
	const [groupBy, setGroupBy] = useState<ProjectListGroupBy>('status');
	const [{ listSort: rawSort, listDirection: rawDirection }, setListParams] =
		useQueryStates({
			listSort: parseAsString.withDefault('manual'),
			listDirection: parseAsString.withDefault('asc')
		});
	const sort = isProjectListSort(rawSort) ? rawSort : 'manual';
	const direction = isProjectListDirection(rawDirection) ? rawDirection : 'asc';
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
		{}
	);

	const groups = useMemo(
		() =>
			groupProjectListTasks(tasks, groupBy, sprints).map((group) => ({
				...group,
				tasks: sortProjectListTasks(group.tasks, sort, direction)
			})),
		[tasks, groupBy, sprints, sort, direction]
	);

	const isExpanded = (key: string, taskCount: number) =>
		expandedGroups[key] ?? taskCount > 0;
	const allGroupsExpanded = groups.every((group) =>
		isExpanded(group.key, group.tasks.length)
	);

	const setAllGroupsExpanded = (expanded: boolean) => {
		setExpandedGroups(
			Object.fromEntries(groups.map((group) => [group.key, expanded]))
		);
	};

	return (
		<div className="flex h-full min-w-0 flex-col overflow-hidden">
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<ListFilter className="h-4 w-4" />
					<span>{tasks.length} visible tasks</span>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={groupBy}
						onValueChange={(value) => setGroupBy(value as ProjectListGroupBy)}
					>
						<SelectTrigger
							className="h-8 w-[140px]"
							aria-label="Group tasks by"
						>
							<SelectValue placeholder="Group by" />
						</SelectTrigger>
						<SelectContent>
							{groupOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									Group by {option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={sort}
						onValueChange={(value) =>
							setListParams({ listSort: value as ProjectListSort })
						}
					>
						<SelectTrigger className="h-8 w-[140px]" aria-label="Sort tasks by">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									Sort by {option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-1.5"
						disabled={sort === 'manual'}
						aria-label={
							sort === 'manual'
								? 'Sort direction unavailable for manual order'
								: `Sort direction: ${directionLabels[direction]}`
						}
						title={
							sort === 'manual'
								? 'Manual order has no direction'
								: directionLabels[direction]
						}
						onClick={() =>
							setListParams({
								listDirection: direction === 'asc' ? 'desc' : 'asc'
							})
						}
					>
						{sort === 'manual' ? '—' : direction === 'asc' ? 'Asc' : 'Desc'}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 gap-1.5"
						onClick={() => setAllGroupsExpanded(!allGroupsExpanded)}
						aria-pressed={allGroupsExpanded}
					>
						{allGroupsExpanded ? (
							<ChevronsDownUp className="h-4 w-4" />
						) : (
							<ChevronsUpDown className="h-4 w-4" />
						)}
						{allGroupsExpanded ? 'Collapse all' : 'Expand all'}
					</Button>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto p-4">
				{tasks.length === 0 && (
					<div className="mb-4 rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
						No tasks match the current filters.
					</div>
				)}
				<Table className="min-w-[980px] border">
					<TableHeader>
						<TableRow>
							<TableHead className="w-28">Task ID</TableHead>
							<TableHead>Title</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Assignee</TableHead>
							<TableHead>Sprint</TableHead>
						</TableRow>
					</TableHeader>
					{groups.map((group) => {
						const expanded = isExpanded(group.key, group.tasks.length);
						return (
							<TableBody key={group.key}>
								<TableRow className="bg-muted/30 hover:bg-muted/30">
									<TableCell colSpan={7} className="p-0">
										<button
											type="button"
											className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
											aria-expanded={expanded}
											onClick={() =>
												setExpandedGroups((current) => ({
													...current,
													[group.key]: !expanded
												}))
											}
										>
											{expanded ? (
												<ChevronDown className="h-4 w-4 shrink-0" />
											) : (
												<ChevronRight className="h-4 w-4 shrink-0" />
											)}
											{group.color && (
												<span
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: group.color }}
												/>
											)}
											<span>{group.label}</span>
											<Badge
												variant="secondary"
												className="px-1.5 py-0 text-xs"
											>
												{group.tasks.length}
											</Badge>
										</button>
									</TableCell>
								</TableRow>
								{expanded &&
									group.tasks.map((task) => (
										<TaskRow key={task.id} task={task} />
									))}
							</TableBody>
						);
					})}
				</Table>
			</div>
		</div>
	);
}
