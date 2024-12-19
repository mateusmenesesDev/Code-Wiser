import type { TaskPriorityEnum } from '@prisma/client';
import { api } from '~/trpc/react';

export function useTask() {
	const utils = api.useUtils();
	const updateTaskPriorityMutation = api.task.updatePriority.useMutation({
		onSuccess: () => {
			utils.projectTemplate.getBySlug.invalidate();
			utils.project.getBySlug.invalidate();
		}
	});

	const createTask = api.task.create.useMutation({
		onSuccess: () => {
			utils.task.invalidate();
		}
	});

	const updateTaskPriority = (taskId: string, priority: TaskPriorityEnum) =>
		updateTaskPriorityMutation.mutate({
			taskId,
			priority
		});

	return {
		createTask,
		updateTaskPriority,
		updateTaskPriorityMutation
	};
}
