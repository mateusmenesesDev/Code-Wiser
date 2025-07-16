import type { TaskStatusEnum } from '@prisma/client';
import type { TasksApiOutput } from '../workspace/types/Task.type';

export interface Column {
	id: TaskStatusEnum;
	title: string;
	tasks: NonNullable<TasksApiOutput>[number][];
	color: string;
	bgClass: string;
	borderClass: string;
}
