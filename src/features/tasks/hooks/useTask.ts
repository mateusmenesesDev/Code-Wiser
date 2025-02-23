import type { Task } from '@prisma/client';
import { toast } from 'sonner';
import { convertUndefinedToNull } from '~/common/utils/convertion';
import { api } from '~/trpc/react';
import type { CreateTaskInput, UpdateTaskInput } from '../types/task.type';

type UseTaskProps = {
	isTemplate?: boolean;
	projectSlug?: string;
};

const useTaskMutations = ({ isTemplate, projectSlug }: UseTaskProps) => {
	const utils = api.useUtils();
	const getProjectFunction = isTemplate
		? utils.projectTemplate.getBySlug
		: utils.project.getBySlug;

	const createTaskMutation = api.task.create.useMutation({
		onMutate: (newTask) => {
			getProjectFunction.cancel();

			const previousData = getProjectFunction.getData({
				slug: projectSlug as string
			});

			const newTaskWithPrismaFields = {
				...convertUndefinedToNull(newTask),
				id: '-1',
				createdAt: new Date(),
				updatedAt: new Date(),
				projectId: isTemplate ? null : (projectSlug ?? null),
				projectTemplateId: isTemplate ? (projectSlug ?? null) : null
			} as Task;

			getProjectFunction.setData({ slug: projectSlug as string }, (old) => {
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
				{ slug: projectSlug as string },
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
				slug: projectSlug as string
			});

			getProjectFunction.setData({ slug: projectSlug as string }, (old) => {
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

			toast.error('Failed to update task');
		},
		onSettled: () => {
			const apiFunction = isTemplate
				? utils.projectTemplate.getBySlug
				: utils.project.getBySlug;

			apiFunction.invalidate();
		}
	});

	const deleteTaskMutation = api.task.delete.useMutation({
		onMutate: ({ taskId }) => {
			getProjectFunction.cancel();

			const previousData = getProjectFunction.getData({
				slug: projectSlug as string
			});

			getProjectFunction.setData({ slug: projectSlug as string }, (old) => {
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
				{ slug: projectSlug as string },
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
				slug: projectSlug as string
			});

			getProjectFunction.setData({ slug: projectSlug as string }, (old) => {
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
				{ slug: projectSlug as string },
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

export function useTask({
	isTemplate = false,
	projectSlug
}: UseTaskProps = {}) {
	const {
		createTaskMutation,
		updateTaskMutation,
		deleteTaskMutation,
		bulkDeleteTasksMutation
	} = useTaskMutations({
		isTemplate,
		projectSlug
	});

	const createTask = (createTaskInput: CreateTaskInput) =>
		createTaskMutation.mutate(createTaskInput);

	const getAllTasksByProjectSlug = (projectSlug: string) =>
		api.task.getAllByProjectSlug.useQuery({
			projectSlug
		});

	const getAllTasksByProjectTemplateSlug = (projectTemplateSlug: string) =>
		api.task.getAllByProjectTemplateSlug.useQuery({
			projectTemplateSlug
		});

	const updateTask = (updateTaskInput: UpdateTaskInput) =>
		updateTaskMutation.mutate(updateTaskInput);

	const deleteTask = (taskId: string) => deleteTaskMutation.mutate({ taskId });
	const bulkDeleteTasks = (taskIds: string[]) =>
		bulkDeleteTasksMutation.mutate({ taskIds });

	return {
		createTask,
		updateTask,
		getAllTasksByProjectSlug,
		getAllTasksByProjectTemplateSlug,
		deleteTask,
		bulkDeleteTasks
	};
}
