import { TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { toast } from 'sonner';
import { normalizeDate } from '~/common/utils/convertion';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { api } from '~/trpc/react';
import type {
	CreateTaskInput,
	UpdateTaskInput
} from '../../workspace/types/Task.type';
import { createInvalidateHelpers } from '../utils/optimisticDataHelpers';
import {
	updateOptimisticData,
	rollbackOptimisticData,
	type OptimisticUpdateConfig
} from '../utils/optimisticData';

type UseTaskProps = {
	projectId: string;
};

const useTaskMutations = ({ projectId }: UseTaskProps) => {
	const utils = api.useUtils();

	const isTemplate = useIsTemplate();

	const { invalidateBacklogData, invalidateKanbanData, invalidateTaskById } =
		createInvalidateHelpers({ projectId, isTemplate, utils });

	const createTaskMutation = api.task.create.useMutation({
		onMutate: (newTask) => {
			const config: OptimisticUpdateConfig = {
				updateBacklog: true,
				updateKanban: true,
				updateGetById: false
			};

			// Normalize dueDate to ensure proper typing
			const typedNewTask: CreateTaskInput = {
				...newTask,
				dueDate: normalizeDate(newTask.dueDate)
			};

			const context = updateOptimisticData({
				utils,
				projectId: projectId as string,
				isTemplate,
				config,
				data: typedNewTask,
				operation: 'create'
			});

			return context;
		},
		onError: (_error, _newTask, ctx) => {
			rollbackOptimisticData({
				utils,
				context: ctx,
				projectId: projectId as string,
				isTemplate
			});
			toast.error('Failed to create task');
		},
		onSettled: () => {
			invalidateKanbanData();
			invalidateBacklogData();
		}
	});

	const updateTaskMutation = api.task.update.useMutation({
		onMutate: (taskUpdate) => {
			const config: OptimisticUpdateConfig = {
				updateBacklog: true,
				updateKanban: true,
				updateGetById: true
			};

			// Normalize dueDate to ensure proper typing
			const typedTaskUpdate: UpdateTaskInput = {
				...taskUpdate,
				dueDate: normalizeDate(taskUpdate.dueDate)
			};

			const context = updateOptimisticData({
				utils,
				projectId,
				isTemplate,
				taskId: taskUpdate.id as string,
				config,
				data: typedTaskUpdate,
				operation: 'update'
			});

			return context;
		},
		onError: (_error, _taskUpdate, ctx) => {
			rollbackOptimisticData({
				utils,
				context: ctx,
				projectId,
				isTemplate,
				taskId: _taskUpdate.id
			});
			toast.error('Failed to update task');
		},
		onSettled: (taskUpdate) => {
			invalidateBacklogData();
			invalidateKanbanData();
			invalidateTaskById(taskUpdate?.id as string);
		}
	});

	const deleteTaskMutation = api.task.delete.useMutation({
		onMutate: ({ taskId }) => {
			const config: OptimisticUpdateConfig = {
				updateKanban: true,
				updateGetById: true,
				updateBacklog: false
			};

			const context = updateOptimisticData({
				utils,
				projectId,
				isTemplate,
				taskId,
				config,
				operation: 'delete'
			});

			return context;
		},
		onError: (_error, _vars, ctx) => {
			rollbackOptimisticData({
				utils,
				context: ctx,
				projectId,
				isTemplate,
				taskId: _vars.taskId
			});
			toast.error('Failed to delete task');
		},
		onSettled: (_data, _error, variables) => {
			invalidateKanbanData();
			invalidateTaskById(variables.taskId);
		}
	});

	const bulkDeleteTasksMutation = api.task.bulkDelete.useMutation({
		onMutate: ({ taskIds }) => {
			const config: OptimisticUpdateConfig = {
				updateKanban: true,
				updateBacklog: true,
				updateGetById: false
			};

			const context = updateOptimisticData({
				utils,
				projectId,
				isTemplate,
				config,
				data: { taskIds },
				operation: 'bulkDelete'
			});

			return context;
		},
		onError: (_error, _vars, ctx) => {
			rollbackOptimisticData({
				utils,
				context: ctx,
				projectId,
				isTemplate
			});
			toast.error('Failed to delete tasks');
		},
		onSettled: () => {
			invalidateKanbanData();
			invalidateBacklogData();
		}
	});

	const updateTaskOrdersMutation = api.task.updateTaskOrders.useMutation({
		onMutate: async ({ updates }) => {
			const queryKey = { id: projectId };
			await utils.projectTemplate.getById.cancel(queryKey);
			utils.task.getAllByProjectId.cancel({
				projectId,
				isTemplate
			});

			const previousProjectData =
				utils.projectTemplate.getById.getData(queryKey);
			const previousTaskData = utils.task.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			if (previousProjectData) {
				const optimisticTasks = [...previousProjectData.tasks];
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
					...previousProjectData,
					tasks: optimisticTasks
				});
			}

			if (previousTaskData) {
				const optimisticTaskData = [...previousTaskData];
				for (const { id: taskId, order } of updates) {
					const taskIndex = optimisticTaskData.findIndex(
						(t) => t.id === taskId
					);
					if (taskIndex !== -1) {
						const existingTask = optimisticTaskData[taskIndex];
						if (existingTask) {
							optimisticTaskData[taskIndex] = {
								...existingTask,
								order
							};
						}
					}
				}

				utils.task.getAllByProjectId.setData(
					{ projectId, isTemplate },
					optimisticTaskData
				);
			}

			return { previousProjectData, previousTaskData };
		},
		onError: (_error, _variables, context) => {
			const queryKey = { id: projectId };
			if (context?.previousProjectData) {
				utils.projectTemplate.getById.setData(
					queryKey,
					context.previousProjectData
				);
			}

			if (context?.previousTaskData) {
				utils.task.getAllByProjectId.setData(
					{ projectId, isTemplate },
					context.previousTaskData
				);
			}
		},
		onSettled: () => {
			const queryKey = { id: projectId };
			utils.projectTemplate.getById.invalidate(queryKey);
			utils.task.getAllByProjectId.invalidate({
				projectId,
				isTemplate
			});
		}
	});

	const generateTaskDescriptionMutation =
		api.ai.generateTaskDescription.useMutation();

	return {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation,
		updateTaskOrdersMutation,
		generateTaskDescriptionMutation
	};
};

export function useTask({ projectId }: UseTaskProps) {
	const isTemplate = useIsTemplate();
	const {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation,
		updateTaskOrdersMutation,
		generateTaskDescriptionMutation
	} = useTaskMutations({
		projectId
	});

	const createTask = (createTaskInput: CreateTaskInput) =>
		createTaskMutation.mutate(createTaskInput);

	const getAllTasksByProjectId = (projectId: string) =>
		api.task.getAllByProjectId.useSuspenseQuery({
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

	const generateTaskDescription = (
		taskDescription: string,
		options?: {
			onSuccess?: (generatedText: string) => void;
			onError?: (error: unknown) => void;
		}
	) =>
		generateTaskDescriptionMutation.mutate(
			{ projectId, taskDescription },
			{
				onSuccess: (data) => {
					toast.success('Task description generated successfully');
					options?.onSuccess?.(data);
				},
				onError: (error) => {
					toast.error('Failed to generate task description');
					options?.onError?.(error);
				}
			}
		);

	return {
		createTask,
		updateTask,
		getAllTasksByProjectId,
		deleteTask,
		bulkDeleteTasks,
		updateTaskOrders,
		generateTaskDescription,
		isGeneratingDescription: generateTaskDescriptionMutation.isPending
	};
}
