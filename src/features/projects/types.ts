import type { Epic, Task } from '@prisma/client';

export interface Column {
	id: string;
	title: string;
	tasks: Task[];
	color?: string;
}

export type EpicWithTasks = Epic & {
	tasks: Task[];
};
