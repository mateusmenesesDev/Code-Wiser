import type { TaskStatusEnum } from '@prisma/client';
import { useCallback, useMemo } from 'react';
import { api } from '~/trpc/react';
import {
	type TaskFilters,
	generateKanbanColumns
} from '../utils/kanbanColumns';

const sortTasksByOrder = (
	a: { order: number | null; createdAt: Date },
	b: { order: number | null; createdAt: Date }
) => {
	if (a.order == null && b.order == null) {
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	}
	if (a.order == null) return 1;
	if (b.order == null) return -1;

	return a.order - b.order;
};

export function useKanbanData(projectSlug: string, filters?: TaskFilters) {
	const utils = api.useUtils();

	const { data: projectData, isLoading } = api.project.getBySlug.useQuery({
		slug: projectSlug
	});

	const columns = useMemo(() => {
		if (!projectData?.tasks) return [];
		return generateKanbanColumns(projectData.tasks, filters);
	}, [projectData?.tasks, filters]);

	const updateTaskOrdersMutation = api.task.updateTaskOrders.useMutation({
		onMutate: async ({ updates: _updates }) => {
			const queryKey = { slug: projectSlug };

			await utils.project.getBySlug.cancel(queryKey);

			const previousData = utils.project.getBySlug.getData(queryKey);
			return { previousData };
		},
		onError: (_error, _variables, context) => {
			const queryKey = { slug: projectSlug };

			if (context?.previousData) {
				utils.project.getBySlug.setData(queryKey, context.previousData);
			}
		},
		onSettled: () => {
			const queryKey = { slug: projectSlug };

			utils.project.getBySlug.invalidate(queryKey);
		}
	});

	const moveTask = useCallback(
		(
			taskId: string,
			fromColumnId: TaskStatusEnum,
			toColumnId: TaskStatusEnum,
			toIndex: number
		) => {
			if (!projectData?.tasks) return;

			console.log('🔄 Moving task:', {
				taskId,
				fromColumnId,
				toColumnId,
				toIndex
			});

			const newStatus = toColumnId;
			const taskToMove = projectData.tasks.find((task) => task.id === taskId);
			if (!taskToMove) return;

			const queryKey = { slug: projectSlug };

			const optimisticTasks = projectData.tasks.map((task) => ({ ...task }));

			const movedTaskIndex = optimisticTasks.findIndex(
				(task) => task.id === taskId
			);
			if (movedTaskIndex !== -1) {
				const task = optimisticTasks[movedTaskIndex];
				if (task) {
					task.status = newStatus;
				}
			}

			utils.project.getBySlug.setData(queryKey, (oldData) => {
				if (!oldData) return oldData;
				console.log('📝 Updating cache with optimistic tasks');
				return {
					...oldData,
					tasks: optimisticTasks
				};
			});

			const updates: Array<{ id: string; order: number; status?: string }> = [];

			if (fromColumnId === toColumnId) {
				const columnTasks = optimisticTasks
					.filter((task) => task.status === newStatus)
					.sort(sortTasksByOrder);

				const taskIndex = columnTasks.findIndex((task) => task.id === taskId);
				if (taskIndex !== -1) {
					const [movedTask] = columnTasks.splice(taskIndex, 1);
					if (movedTask) {
						columnTasks.splice(toIndex, 0, movedTask);
					}
				}

				columnTasks.forEach((task, index) => {
					const taskInArray = optimisticTasks.find((t) => t.id === task.id);
					if (taskInArray) {
						taskInArray.order = index;
					}
					updates.push({ id: task.id, order: index });
				});
			} else {
				const sourceColumnTasks = optimisticTasks
					.filter((task) => task.status === fromColumnId)
					.sort(sortTasksByOrder);

				sourceColumnTasks.forEach((task, index) => {
					const taskInArray = optimisticTasks.find((t) => t.id === task.id);
					if (taskInArray) {
						taskInArray.order = index;
					}
					updates.push({ id: task.id, order: index });
				});

				const targetColumnTasks = optimisticTasks
					.filter((task) => task.status === newStatus && task.id !== taskId)
					.sort(sortTasksByOrder);

				const movedTask = optimisticTasks.find((task) => task.id === taskId);
				if (movedTask) {
					targetColumnTasks.splice(toIndex, 0, movedTask);
				}

				targetColumnTasks.forEach((task, index) => {
					const taskInArray = optimisticTasks.find((t) => t.id === task.id);
					if (taskInArray) {
						taskInArray.order = index;
					}
					updates.push({
						id: task.id,
						order: index,
						...(task.id === taskId && { status: newStatus })
					});
				});
			}

			utils.project.getBySlug.setData(queryKey, (oldData) => {
				if (!oldData) return oldData;
				console.log('📝 Final cache update with orders');
				return {
					...oldData,
					tasks: optimisticTasks
				};
			});

			updateTaskOrdersMutation.mutate({ updates });
		},
		[updateTaskOrdersMutation, projectData?.tasks, utils, projectSlug]
	);

	return {
		columns,
		isLoading,
		moveTask
	};
}
