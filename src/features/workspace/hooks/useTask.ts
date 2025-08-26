import { type Task, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { toast } from 'sonner';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { convertUndefinedToNull } from '~/common/utils/convertion';
import { api } from '~/trpc/react';
import type { CreateTaskInput, UpdateTaskInput } from '../types/Task.type';

type UseTaskProps = {
	projectId?: string;
};

const useTaskMutations = ({ projectId }: UseTaskProps) => {
	const isTemplate = useIsTemplate();
	const utils = api.useUtils();
	const getProjectFunction = isTemplate
		? utils.projectTemplate.getById
		: utils.project.getById;

	const createTaskMutation = api.task.create.useMutation({
		onMutate: (newTask) => {
			getProjectFunction.cancel();

			const previousData = getProjectFunction.getData({
				id: projectId as string
			});

			const newTaskWithPrismaFields = {
				...convertUndefinedToNull(newTask, ['epicId', 'sprintId']),
				id: '-1',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: isTemplate ? null : (projectId ?? null),
				projectTemplateId: isTemplate ? (projectId ?? null) : null,
				kanbanColumn: null
			} as Task & { kanbanColumn: null };

			getProjectFunction.setData({ id: projectId as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: [...old.tasks, newTaskWithPrismaFields]
				};
			});

			return { previousData };
		},
		onError: (_error, _newTask, ctx) => {
			getProjectFunction.setData(
				{ id: projectId as string },
				ctx?.previousData
			);

			toast.error('Failed to create task');
		},
		onSettled: () => {
			utils.task.invalidate();
			getProjectFunction.invalidate();
			utils.task.getAllByProjectId.invalidate({
				projectId: projectId as string,
				isTemplate
			});
		}
	});

	const updateTaskMutation = api.task.update.useMutation({
		onMutate: (taskUpdate) => {
			getProjectFunction.cancel();

			const previousData = getProjectFunction.getData({
				id: projectId as string
			});

			getProjectFunction.setData({ id: projectId as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: old.tasks.map((task) => {
						if (task.id === taskUpdate.id) {
							return {
								...task,
								...convertUndefinedToNull(taskUpdate, ['epicId', 'sprintId'])
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
				? utils.projectTemplate.getById
				: utils.project.getById;

			apiFunction.setData({ id: projectId as string }, ctx?.previousData);

			toast.error('Failed to update task');
		},
		onSettled: () => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getById
				: utils.project.getById;

			apiFunction.invalidate();
			utils.task.getAllByProjectId.invalidate({
				projectId: projectId as string,
				isTemplate
			});
		}
	});

	const deleteTaskMutation = api.task.delete.useMutation({
		onMutate: ({ taskId }) => {
			getProjectFunction.cancel();

			const previousData = getProjectFunction.getData({
				id: projectId as string
			});

			getProjectFunction.setData({ id: projectId as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: old.tasks.filter((task) => task.id !== taskId)
				};
			});

			return { previousData };
		},
		onError: (_error, _taskId, ctx) => {
			getProjectFunction.setData(
				{ id: projectId as string },
				ctx?.previousData
			);
		},
		onSettled: () => {
			getProjectFunction.invalidate();
			utils.task.getAllByProjectId.invalidate({
				projectId: projectId as string,
				isTemplate
			});
		}
	});

	const bulkDeleteTasksMutation = api.task.bulkDelete.useMutation({
		onMutate: ({ taskIds }) => {
			getProjectFunction.cancel();

			const previousData = getProjectFunction.getData({
				id: projectId as string
			});

			getProjectFunction.setData({ id: projectId as string }, (old) => {
				if (!old) return old;
				return {
					...old,
					tasks: old.tasks.filter((task) => !taskIds.includes(task.id))
				};
			});

			return { previousData };
		},
		onError: (_error, _vars, ctx) => {
			getProjectFunction.setData(
				{ id: projectId as string },
				ctx?.previousData
			);
		},
		onSuccess: () => {
			getProjectFunction.invalidate();
			utils.task.getAllByProjectId.invalidate({
				projectId: projectId as string,
				isTemplate
			});
		}
	});

	const updateTaskOrdersMutation = api.task.updateTaskOrders.useMutation({
		onMutate: async ({ updates }) => {
			const queryKey = { id: projectId as string };
			await utils.projectTemplate.getById.cancel(queryKey);

			const previousData = utils.projectTemplate.getById.getData(queryKey);

			if (previousData) {
				const optimisticTasks = [...previousData.tasks];
				for (const { id: taskId, order } of updates) {
					const taskIndex = optimisticTasks.findIndex((t) => t.id === taskId);
					if (taskIndex !== -1) {
						const existingTask = optimisticTasks[taskIndex];
						if (existingTask) {
							optimisticTasks[taskIndex] = {
								...existingTask,
								id: existingTask.id,
								order,
								type: existingTask.type || TaskTypeEnum.TASK,
								status: existingTask.status || TaskStatusEnum.BACKLOG,
								createdAt: existingTask.createdAt || new Date(),
								updatedAt: existingTask.updatedAt || new Date(),
								title: existingTask.title,
								description: existingTask.description || null,
								priority: existingTask.priority || null,
								tags: existingTask.tags,
								epicId: existingTask.epicId || null,
								sprintId: existingTask.sprintId || null
							};
						}
					}
				}

				utils.projectTemplate.getById.setData(queryKey, {
					...previousData,
					tasks: optimisticTasks
				});
			}

			return { previousData };
		},
		onError: (_error, _variables, context) => {
			const queryKey = { id: projectId as string };
			if (context?.previousData) {
				utils.projectTemplate.getById.setData(queryKey, context.previousData);
			}
		},
		onSettled: () => {
			const queryKey = { id: projectId as string };
			utils.projectTemplate.getById.invalidate(queryKey);
			utils.task.getAllByProjectId.invalidate({
				projectId: projectId as string,
				isTemplate
			});
		}
	});

	return {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation,
		updateTaskOrdersMutation
	};
};

export function useTask({ projectId }: UseTaskProps = {}) {
	const isTemplate = useIsTemplate();
	const {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation,
		updateTaskOrdersMutation
	} = useTaskMutations({
		projectId
	});

	const createTask = (createTaskInput: CreateTaskInput) =>
		createTaskMutation.mutate(createTaskInput);

	const getAllTasksByProjectId = (projectId: string) =>
		api.task.getAllByProjectId.useQuery({
			projectId,
			isTemplate
		});

	const updateTask = (updateTaskInput: UpdateTaskInput) =>
		updateTaskMutation.mutate(updateTaskInput);

	const deleteTask = (taskId: string) => deleteTaskMutation.mutate({ taskId });
	const bulkDeleteTasks = (taskIds: string[]) =>
		bulkDeleteTasksMutation.mutate({ taskIds });

	const updateTaskOrders = (updates: { id: string; order: number }[]) =>
		updateTaskOrdersMutation.mutate({ updates });

	return {
		createTask,
		updateTask,
		getAllTasksByProjectId,
		deleteTask,
		bulkDeleteTasks,
		updateTaskOrders
	};
}
