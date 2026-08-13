import { toast } from 'sonner';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { normalizeDate } from '~/common/utils/convertion';
import { applyTaskOrderUpdates } from '~/common/utils/kanbanReorder';
import { api } from '~/trpc/react';
import type {
	CreateTaskInput,
	UpdateTaskInput
} from '../../workspace/types/Task.type';
import {
	type OptimisticUpdateConfig,
	rollbackOptimisticData,
	updateOptimisticData
} from '../utils/optimisticData';
import { createInvalidateHelpers } from '../utils/optimisticDataHelpers';

type UseTaskProps = {
	projectId: string;
};

const useTaskMutations = ({ projectId }: UseTaskProps) => {
	const utils = api.useUtils();

	const isTemplate = useIsTemplate();

	const {
		invalidateBacklogData,
		invalidateKanbanData,
		invalidateRoadmapData,
		invalidateTaskById
	} = createInvalidateHelpers({ projectId, isTemplate, utils });

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
		onError: (error, _newTask, ctx) => {
			rollbackOptimisticData({
				utils,
				context: ctx,
				projectId: projectId as string,
				isTemplate
			});
			toast.error(error.message || 'Failed to create task');
		},
		onSettled: () => {
			invalidateKanbanData();
			invalidateBacklogData();
			invalidateRoadmapData();
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
		onError: (error, _taskUpdate, ctx) => {
			rollbackOptimisticData({
				utils,
				context: ctx,
				projectId,
				isTemplate,
				taskId: _taskUpdate.id
			});
			toast.error(error.message || 'Failed to update task');
		},
		onSettled: (taskUpdate) => {
			invalidateBacklogData();
			invalidateKanbanData();
			invalidateRoadmapData();
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
			invalidateRoadmapData();
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
			invalidateRoadmapData();
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
				utils.projectTemplate.getById.setData(queryKey, {
					...previousProjectData,
					tasks: applyTaskOrderUpdates(previousProjectData.tasks, updates, {
						sort: false
					})
				});
			}

			if (previousTaskData) {
				utils.task.getAllByProjectId.setData(
					{ projectId, isTemplate },
					applyTaskOrderUpdates(previousTaskData, updates, { sort: false })
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
			invalidateRoadmapData();
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

	const createTaskAsync = (createTaskInput: CreateTaskInput) =>
		createTaskMutation.mutateAsync(createTaskInput);

	const getAllTasksByProjectId = (projectId: string) =>
		api.task.getAllByProjectId.useSuspenseQuery({
			projectId,
			isTemplate
		});

	const updateTask = (updateTaskInput: UpdateTaskInput) =>
		updateTaskMutation.mutate(updateTaskInput);

	const updateTaskAsync = (updateTaskInput: UpdateTaskInput) =>
		updateTaskMutation.mutateAsync(updateTaskInput);

	const deleteTask = (taskId: string) => deleteTaskMutation.mutate({ taskId });

	const deleteTaskAsync = (taskId: string) =>
		deleteTaskMutation.mutateAsync({ taskId });
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
			{ projectId, taskDescription, isTemplate },
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
		createTaskAsync,
		updateTask,
		updateTaskAsync,
		getAllTasksByProjectId,
		deleteTask,
		deleteTaskAsync,
		bulkDeleteTasks,
		updateTaskOrders,
		generateTaskDescription,
		isGeneratingDescription: generateTaskDescriptionMutation.isPending,
		isCreatingTask: createTaskMutation.isPending
	};
}
