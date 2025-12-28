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

export const resetFormData = (
	task: TaskApiOutput | undefined,
	projectId: string,
	isTemplate: boolean
) => {
	console.log('projectId', projectId);
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
			storyPoints: task.storyPoints ?? undefined
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
