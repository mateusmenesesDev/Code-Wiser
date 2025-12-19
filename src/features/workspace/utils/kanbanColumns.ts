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
		color: 'bg-status-backlog-muted border-status-backlog-border',
		bgClass: 'bg-status-backlog-muted',
		borderClass: 'border-status-backlog-border'
	},
	[TaskStatusEnum.READY_TO_DEVELOP]: {
		title: 'Ready to Develop',
		color: 'bg-status-ready-muted border-status-ready-border',
		bgClass: 'bg-status-ready-muted',
		borderClass: 'border-status-ready-border'
	},
	[TaskStatusEnum.IN_PROGRESS]: {
		title: 'In Progress',
		color: 'bg-status-in-progress-muted border-status-in-progress-border',
		bgClass: 'bg-status-in-progress-muted',
		borderClass: 'border-status-in-progress-border'
	},
	[TaskStatusEnum.CODE_REVIEW]: {
		title: 'Code Review',
		color: 'bg-status-review-muted border-status-review-border',
		bgClass: 'bg-status-review-muted',
		borderClass: 'border-status-review-border'
	},
	[TaskStatusEnum.TESTING]: {
		title: 'Testing',
		color: 'bg-status-testing-muted border-status-testing-border',
		bgClass: 'bg-status-testing-muted',
		borderClass: 'border-status-testing-border'
	},
	[TaskStatusEnum.DONE]: {
		title: 'Done',
		color: 'bg-status-done-muted border-status-done-border',
		bgClass: 'bg-status-done-muted',
		borderClass: 'border-status-done-border'
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
