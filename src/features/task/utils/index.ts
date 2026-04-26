import { TaskPriorityEnum, TaskStatusEnum } from '@prisma/client';
import type { z } from 'zod';
import type {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import type { TaskApiOutput } from '~/features/workspace/types/Task.type';

type TaskFormData =
	| z.infer<typeof createTaskSchema>
	| z.infer<typeof updateTaskSchema>;

/** Coerce API / RHF values so story points are always a finite number or undefined (avoids duplicate Radix Select values when `"5"` !== 5). */
export function normalizeStoryPointsForForm(raw: unknown): number | undefined {
	if (raw === '' || raw === null || raw === undefined) return undefined;
	if (typeof raw === 'number') {
		return Number.isFinite(raw) ? raw : undefined;
	}
	if (typeof raw === 'string') {
		const t = raw.trim();
		if (t === '') return undefined;
		const n = Number.parseInt(t, 10);
		return Number.isNaN(n) ? undefined : n;
	}
	return undefined;
}

export const resetFormData = (
	task: TaskApiOutput | undefined,
	projectId: string,
	isTemplate: boolean
) => {
	let formData: TaskFormData;
	if (task) {
		formData = {
			isTemplate,
			id: task.id,
			title: task.title,
			description: task.description ?? undefined,
			type: task.type ?? undefined,
			priority: task.priority ?? undefined,
			tags: task.tags || [],
			epicId: task.epicId || undefined,
			sprintId: task.sprintId || undefined,
			assigneeId: task.assigneeId ?? undefined,
			blockedReason: task.blockedReason ?? undefined,
			blocked: task.blocked ?? false,
			status: task.status ?? undefined,
			dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
			projectId,
			storyPoints: normalizeStoryPointsForForm(task.storyPoints)
		};
	} else {
		formData = {
			isTemplate,
			title: '',
			description: undefined,
			type: undefined,
			priority: TaskPriorityEnum.MEDIUM,
			tags: [],
			epicId: undefined,
			sprintId: undefined,
			assigneeId: undefined,
			blockedReason: undefined,
			blocked: false,
			status: TaskStatusEnum.BACKLOG,
			dueDate: undefined,
			projectId,
			storyPoints: undefined
		};
	}
	return formData;
};

export const getStatusLabel = (status: TaskStatusEnum) => {
	switch (status) {
		case TaskStatusEnum.BACKLOG:
			return 'To Do';
		case TaskStatusEnum.READY_TO_DEVELOP:
			return 'Ready to Develop';
		case TaskStatusEnum.IN_PROGRESS:
			return 'In Progress';
		case TaskStatusEnum.CODE_REVIEW:
			return 'Code Review';
		case TaskStatusEnum.DONE:
			return 'Done';
		default:
			return status;
	}
};
