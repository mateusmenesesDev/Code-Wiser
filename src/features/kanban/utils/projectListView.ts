import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import type { RouterOutputs } from '~/trpc/react';
import { columns } from '../constants';

export type ProjectListTask = RouterOutputs['kanban']['getKanbanData'][number];
export type ProjectListGroupBy = 'status' | 'sprint' | 'priority';
export type ProjectListSort = 'manual' | 'title' | 'priority';
export type ProjectListDirection = 'asc' | 'desc';
export type ProjectListSprint = { id: string; title: string; order: number };

export type ProjectListGroup = {
	key: string;
	label: string;
	color?: string;
	tasks: ProjectListTask[];
};

export const taskTypeLabels: Record<TaskTypeEnum, string> = {
	[TaskTypeEnum.USER_STORY]: 'User Story',
	[TaskTypeEnum.TASK]: 'Task',
	[TaskTypeEnum.SUBTASK]: 'Subtask',
	[TaskTypeEnum.BUG]: 'Bug'
};

export const taskPriorityLabels: Record<TaskPriorityEnum, string> = {
	[TaskPriorityEnum.LOWEST]: 'Lowest',
	[TaskPriorityEnum.LOW]: 'Low',
	[TaskPriorityEnum.MEDIUM]: 'Medium',
	[TaskPriorityEnum.HIGH]: 'High',
	[TaskPriorityEnum.HIGHEST]: 'Highest'
};

export const taskStatusLabels: Record<TaskStatusEnum, string> = {
	[TaskStatusEnum.BACKLOG]: 'Backlog',
	[TaskStatusEnum.READY_TO_DEVELOP]: 'Ready to Develop',
	[TaskStatusEnum.IN_PROGRESS]: 'In Progress',
	[TaskStatusEnum.CODE_REVIEW]: 'Code Review',
	[TaskStatusEnum.TESTING]: 'Testing',
	[TaskStatusEnum.DONE]: 'Done'
};

const prioritySortOrder: TaskPriorityEnum[] = [
	TaskPriorityEnum.LOWEST,
	TaskPriorityEnum.LOW,
	TaskPriorityEnum.MEDIUM,
	TaskPriorityEnum.HIGH,
	TaskPriorityEnum.HIGHEST
];

const priorityGroupOrder: TaskPriorityEnum[] = [...prioritySortOrder].reverse();

const compareManualOrder = (left: ProjectListTask, right: ProjectListTask) => {
	const orderDifference = (left.order ?? 0) - (right.order ?? 0);
	if (orderDifference !== 0) return orderDifference;

	return (
		new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
	);
};

const comparePriority = (left: ProjectListTask, right: ProjectListTask) => {
	const leftPriority = left.priority
		? prioritySortOrder.indexOf(left.priority)
		: -1;
	const rightPriority = right.priority
		? prioritySortOrder.indexOf(right.priority)
		: -1;
	return leftPriority - rightPriority;
};

export const sortProjectListTasks = (
	tasks: ProjectListTask[],
	sort: ProjectListSort,
	direction: ProjectListDirection
) => {
	return [...tasks].sort((left, right) => {
		if (sort === 'manual') return compareManualOrder(left, right);

		const primaryComparison =
			sort === 'title'
				? left.title.localeCompare(right.title)
				: comparePriority(left, right);
		if (primaryComparison !== 0) {
			return direction === 'desc' ? -primaryComparison : primaryComparison;
		}

		return compareManualOrder(left, right);
	});
};

const createGroups = (
	keys: string[],
	labelByKey: Map<string, string>,
	tasksByKey: Map<string, ProjectListTask[]>,
	colorByKey?: Map<string, string>
): ProjectListGroup[] =>
	keys.map((key) => ({
		key,
		label: labelByKey.get(key) ?? key,
		color: colorByKey?.get(key),
		tasks: tasksByKey.get(key) ?? []
	}));

export const groupProjectListTasks = (
	tasks: ProjectListTask[],
	groupBy: ProjectListGroupBy,
	sprints: ProjectListSprint[]
): ProjectListGroup[] => {
	if (groupBy === 'status') {
		const tasksByStatus = new Map<string, ProjectListTask[]>();
		for (const task of tasks) {
			const key = task.status ?? 'NO_STATUS';
			const group = tasksByStatus.get(key) ?? [];
			group.push(task);
			tasksByStatus.set(key, group);
		}

		const groups = createGroups(
			columns.map((column) => column.id),
			new Map(columns.map((column) => [column.id, column.name])),
			tasksByStatus,
			new Map(columns.map((column) => [column.id, column.color]))
		);
		const tasksWithoutStatus = tasksByStatus.get('NO_STATUS') ?? [];
		if (tasksWithoutStatus.length > 0) {
			groups.push({
				key: 'NO_STATUS',
				label: 'No status',
				tasks: tasksWithoutStatus
			});
		}
		return groups;
	}

	if (groupBy === 'sprint') {
		const tasksBySprint = new Map<string, ProjectListTask[]>();
		for (const task of tasks) {
			const key = task.sprint?.id ?? 'NO_SPRINT';
			const group = tasksBySprint.get(key) ?? [];
			group.push(task);
			tasksBySprint.set(key, group);
		}

		const orderedSprints = [...sprints].sort((left, right) => {
			const orderDifference = left.order - right.order;
			return orderDifference !== 0
				? orderDifference
				: left.title.localeCompare(right.title);
		});
		const visibleSprints = orderedSprints.filter((sprint) =>
			tasksBySprint.has(sprint.id)
		);
		const knownSprintIds = new Set(sprints.map((sprint) => sprint.id));
		const unknownSprintIds = [...tasksBySprint.keys()].filter(
			(key) => key !== 'NO_SPRINT' && !knownSprintIds.has(key)
		);
		const unknownSprintLabels = new Map(
			unknownSprintIds.map((id) => {
				const sprintTask = tasksBySprint.get(id)?.[0];
				return [id, sprintTask?.sprint?.title ?? 'Unknown sprint'] as const;
			})
		);
		return createGroups(
			visibleSprints
				.map((sprint) => sprint.id)
				.concat(unknownSprintIds)
				.concat('NO_SPRINT'),
			new Map([
				...visibleSprints.map((sprint) => [sprint.id, sprint.title] as const),
				...unknownSprintLabels,
				['NO_SPRINT', 'No sprint'] as const
			]),
			tasksBySprint
		);
	}

	const tasksByPriority = new Map<string, ProjectListTask[]>();
	for (const task of tasks) {
		const key = task.priority ?? 'NO_PRIORITY';
		const group = tasksByPriority.get(key) ?? [];
		group.push(task);
		tasksByPriority.set(key, group);
	}
	const priorityKeys = [...priorityGroupOrder, 'NO_PRIORITY' as const];
	return createGroups(
		priorityKeys,
		new Map([
			...priorityGroupOrder.map(
				(priority) => [priority, taskPriorityLabels[priority]] as const
			),
			['NO_PRIORITY', 'No priority'] as const
		]),
		tasksByPriority
	);
};
