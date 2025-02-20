import type { TaskPriorityEnum } from '@prisma/client';
import { api } from '~/trpc/react';
import type { UpdateTaskInput } from '../types/task.type';

type UseTaskProps = {
	isTemplate?: boolean;
	projectSlug?: string;
};

export function useTask({
	isTemplate = false,
	projectSlug
}: UseTaskProps = {}) {
	const utils = api.useUtils();

	const updateTaskPriorityMutation = api.task.updatePriority.useMutation({
		onSuccess: () => {
			utils.projectTemplate.getBySlug.invalidate();
			utils.project.getBySlug.invalidate();
		}
	});

	const updateTaskMutation = api.task.updateTask.useMutation({
		onMutate: (taskUpdate) => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.cancel();

			const previousData = apiFunction.getData({
				slug: projectSlug as string
			});

			apiFunction.setData({ slug: projectSlug as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: old.tasks.map((task) => {
						if (task.id === taskUpdate.taskId) {
							return {
								...task,
								...taskUpdate
							};
						}
						return task;
					})
				};
			});

			return { previousData };
		},
		onError: (_error, _taskUpdate, ctx) => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.setData({ slug: projectSlug as string }, ctx?.previousData);
		},
		onSuccess: () => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.invalidate();
		}
	});

	const deleteTaskMutation = api.task.delete.useMutation({
		onMutate: ({ taskId }) => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.cancel();

			const previousData = apiFunction.getData({
				slug: projectSlug as string
			});

			apiFunction.setData({ slug: projectSlug as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: old.tasks.filter((task) => task.id !== taskId)
				};
			});

			return { previousData };
		},
		onError: (_error, _taskId, ctx) => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.setData({ slug: projectSlug as string }, ctx?.previousData);
		},
		onSettled: () => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.invalidate();
		}
	});

	const createTask = api.task.create.useMutation({
		onSuccess: () => {
			utils.task.invalidate();
			utils.projectTemplate.getBySlug.invalidate();
			utils.project.getBySlug.invalidate();
		}
	});

	const getAllTasksByProjectSlug = (projectSlug: string) =>
		api.task.getAllByProjectSlug.useQuery({
			projectSlug
		});

	const getAllTasksByProjectTemplateSlug = (projectTemplateSlug: string) =>
		api.task.getAllByProjectTemplateSlug.useQuery({
			projectTemplateSlug
		});

	const updateTaskPriority = (taskId: string, priority: TaskPriorityEnum) =>
		updateTaskPriorityMutation.mutate({
			taskId,
			priority
		});

	const updateTask = (updateTaskInput: UpdateTaskInput) =>
		updateTaskMutation.mutate(updateTaskInput);

	const deleteTask = (taskId: string) => deleteTaskMutation.mutate({ taskId });

	const bulkDeleteTasksMutation = api.task.bulkDelete.useMutation({
		onMutate: ({ taskIds }) => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.cancel();

			const previousData = apiFunction.getData({
				slug: projectSlug as string
			});

			apiFunction.setData({ slug: projectSlug as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: old.tasks.filter((task) => !taskIds.includes(task.id))
				};
			});

			return { previousData };
		},
		onError: (_error, _vars, ctx) => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.setData({ slug: projectSlug as string }, ctx?.previousData);
		},
		onSuccess: () => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.invalidate();
		}
	});

	return {
		createTask,
		updateTaskPriority,
		updateTaskPriorityMutation,
		updateTask,
		getAllTasksByProjectSlug,
		getAllTasksByProjectTemplateSlug,
		deleteTask,
		bulkDeleteTasks: (taskIds: string[]) =>
			bulkDeleteTasksMutation.mutate({ taskIds })
	};
}
