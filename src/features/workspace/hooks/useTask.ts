import type { Task } from '@prisma/client';
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
				...convertUndefinedToNull(newTask),
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
		}
	});

	return {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation
	};
};

export function useTask({ projectId }: UseTaskProps = {}) {
	const {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation
	} = useTaskMutations({
		projectId
	});

	const createTask = (createTaskInput: CreateTaskInput) =>
		createTaskMutation.mutate(createTaskInput);

	const getAllTasksByProjectId = (projectId: string) =>
		api.task.getAllByProjectId.useQuery({
			projectId
		});

	const getAllTasksByProjectTemplateId = (projectTemplateId: string) =>
		api.task.getAllByProjectTemplateId.useQuery({
			projectTemplateId
		});

	const updateTask = (updateTaskInput: UpdateTaskInput) =>
		updateTaskMutation.mutate(updateTaskInput);

	const deleteTask = (taskId: string) => deleteTaskMutation.mutate({ taskId });
	const bulkDeleteTasks = (taskIds: string[]) =>
		bulkDeleteTasksMutation.mutate({ taskIds });

	return {
		createTask,
		updateTask,
		getAllTasksByProjectId,
		getAllTasksByProjectTemplateId,
		deleteTask,
		bulkDeleteTasks
	};
}
