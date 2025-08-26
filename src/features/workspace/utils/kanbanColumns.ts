import { TaskStatusEnum } from '@prisma/client';
import type { TasksApiOutput } from '../types/Task.type';

export interface KanbanColumn {
	id: TaskStatusEnum;
	title: string;
	color: string;
	bgClass: string;
	borderClass: string;
	tasks: NonNullable<TasksApiOutput>[number][];
}

export const KANBAN_COLUMN_CONFIG: Record<
	TaskStatusEnum,
	{ title: string; color: string; bgClass: string; borderClass: string }
> = {
	[TaskStatusEnum.BACKLOG]: {
		title: 'Backlog',
		color:
			'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700',
		bgClass: 'bg-slate-50 dark:bg-slate-900/50',
		borderClass: 'border-slate-200 dark:border-slate-700'
	},
	[TaskStatusEnum.READY_TO_DEVELOP]: {
		title: 'Ready to Develop',
		color:
			'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
		bgClass: 'bg-blue-50 dark:bg-blue-950/50',
		borderClass: 'border-blue-200 dark:border-blue-800'
	},
	[TaskStatusEnum.IN_PROGRESS]: {
		title: 'In Progress',
		color:
			'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
		bgClass: 'bg-amber-50 dark:bg-amber-950/50',
		borderClass: 'border-amber-200 dark:border-amber-800'
	},
	[TaskStatusEnum.CODE_REVIEW]: {
		title: 'Code Review',
		color:
			'bg-violet-50 border-violet-200 dark:bg-violet-950/50 dark:border-violet-800',
		bgClass: 'bg-violet-50 dark:bg-violet-950/50',
		borderClass: 'border-violet-200 dark:border-violet-800'
	},
	[TaskStatusEnum.TESTING]: {
		title: 'Testing',
		color:
			'bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800',
		bgClass: 'bg-orange-50 dark:bg-orange-950/50',
		borderClass: 'border-orange-200 dark:border-orange-800'
	},
	[TaskStatusEnum.DONE]: {
		title: 'Done',
		color:
			'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800',
		bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
		borderClass: 'border-emerald-200 dark:border-emerald-800'
	}
};

export interface TaskFilters {
	sprint: string;
	priority: string;
	assignee: string;
}

export function generateKanbanColumns(
	tasks: TasksApiOutput,
	filters?: TaskFilters
): KanbanColumn[] {
	let filteredTasks = tasks;

	if (filters) {
		filteredTasks = tasks.filter((task) => {
			const sprintMatch =
				filters.sprint === 'all' || task.sprintId === filters.sprint;
			const priorityMatch =
				filters.priority === 'all' || task.priority === filters.priority;
			const assigneeMatch =
				filters.assignee === 'all' || task.assigneeId === filters.assignee;

			return sprintMatch && priorityMatch && assigneeMatch;
		});
	}

	const columns: KanbanColumn[] = [];

	for (const status of Object.values(TaskStatusEnum)) {
		const config = KANBAN_COLUMN_CONFIG[status];
		const columnTasks = filteredTasks
			.filter((task) => task.status === status)
			.sort((a, b) => {
				if (a.order == null && b.order == null) {
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
				}
				if (a.order == null) return 1;
				if (b.order == null) return -1;
				return a.order - b.order;
			});

		columns.push({
			id: status,
			title: config.title,
			color: config.color,
			bgClass: config.bgClass,
			borderClass: config.borderClass,
			tasks: columnTasks
		});
	}

	return columns;
}

export interface ProjectStats {
	totalTasks: number;
	completedTasks: number;
	inProgressTasks: number;
	progressPercentage: number;
}

export function calculateProjectStats(columns: KanbanColumn[]): ProjectStats {
	const allTasks = columns.flatMap((column) => column.tasks);
	const totalTasks = allTasks.length;

	const completedTasks = columns
		.filter((column) => column.id === TaskStatusEnum.DONE)
		.flatMap((column) => column.tasks).length;

	const inProgressTasks = columns
		.filter((column) => column.id === TaskStatusEnum.IN_PROGRESS)
		.flatMap((column) => column.tasks).length;

	const progressPercentage =
		totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	return {
		totalTasks,
		completedTasks,
		inProgressTasks,
		progressPercentage
	};
}
