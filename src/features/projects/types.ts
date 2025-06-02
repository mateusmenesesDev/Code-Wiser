import type { Epic, Task, TaskStatusEnum } from '@prisma/client';

export interface Column {
	id: TaskStatusEnum;
	title: string;
	tasks: Array<{
		id: string;
		title: string;
		description?: string | null;
		priority?: string | null;
		status?: string | null;
		tags: string[];
		blocked?: boolean | null;
		blockedReason?: string | null;
		epicId?: string | null;
		sprintId?: string | null;
		dueDate?: Date | null;
		assigneeId?: string | null;
		createdAt?: Date;
	}>;
	color: string;
	bgClass: string;
	borderClass: string;
}

export type EpicWithTasks = Epic & {
	tasks: Task[];
};
