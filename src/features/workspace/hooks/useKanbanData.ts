import type { TaskStatusEnum } from '@prisma/client';
import { useCallback, useMemo, useState } from 'react';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { bucketTasksByStatus } from '~/common/utils/kanbanReorder';
import { api } from '~/trpc/react';
import type { TasksApiOutput } from '../types/Task.type';
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

export function useKanbanData(
	projectId: string,
	filters?: TaskFilters,
	isTemplate?: boolean,
	providedTasks?: TasksApiOutput,
	updateTaskOrders?: (updates: { id: string; order: number }[]) => void
) {
	const utils = api.useUtils();
	const detectedIsTemplate = useIsTemplate();
	const actualIsTemplate = isTemplate ?? detectedIsTemplate;

	const { data: queryTasks, isLoading } = api.task.getAllByProjectId.useQuery({
		projectId,
		isTemplate: actualIsTemplate
	});

	const [optimisticTasks, setOptimisticTasks] = useState<
		TasksApiOutput | undefined
	>(undefined);

	const currentTasks = optimisticTasks || providedTasks || queryTasks;

	const columns = useMemo(() => {
		if (!currentTasks) return [];
		return generateKanbanColumns(currentTasks, filters);
	}, [currentTasks, filters]);

	const moveTask = useCallback(
		(
			taskId: string,
			fromColumnId: TaskStatusEnum,
			toColumnId: TaskStatusEnum,
			toIndex: number
		) => {
			if (!currentTasks) return;

			const newStatus = toColumnId;
			const taskToMove = currentTasks.find((task) => task.id === taskId);
			if (!taskToMove) return;

			const newOptimisticTasks = currentTasks.map((task) =>
				task.id === taskId ? { ...task, status: newStatus } : { ...task }
			);
			const tasksById = new Map(
				newOptimisticTasks.map((task) => [task.id, task])
			);
			const tasksByStatus = bucketTasksByStatus(newOptimisticTasks);

			const queryKey = { id: projectId };
			const updates: Array<{ id: string; order: number; status?: string }> =
				[];

			if (fromColumnId === toColumnId) {
				const columnTasks = [...(tasksByStatus.get(newStatus) ?? [])].sort(
					sortTasksByOrder
				);

				const taskIndex = columnTasks.findIndex((task) => task.id === taskId);
				if (taskIndex !== -1) {
					const [movedTask] = columnTasks.splice(taskIndex, 1);
					if (movedTask) {
						columnTasks.splice(toIndex, 0, movedTask);
					}
				}

				columnTasks.forEach((task, index) => {
					const taskInArray = tasksById.get(task.id);
					if (taskInArray) {
						taskInArray.order = index;
					}
					updates.push({ id: task.id, order: index });
				});
			} else {
				const sourceColumnTasks = [
					...(tasksByStatus.get(fromColumnId) ?? [])
				].sort(sortTasksByOrder);

				sourceColumnTasks.forEach((task, index) => {
					const taskInArray = tasksById.get(task.id);
					if (taskInArray) {
						taskInArray.order = index;
					}
					updates.push({ id: task.id, order: index });
				});

				const targetColumnTasks = [
					...(tasksByStatus.get(newStatus) ?? [])
				]
					.filter((task) => task.id !== taskId)
					.sort(sortTasksByOrder);

				const movedTask = tasksById.get(taskId);
				if (movedTask) {
					targetColumnTasks.splice(toIndex, 0, movedTask);
				}

				targetColumnTasks.forEach((task, index) => {
					const taskInArray = tasksById.get(task.id);
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

			if (actualIsTemplate) {
				utils.projectTemplate.getById.setData(queryKey, (oldData) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						tasks: newOptimisticTasks
					};
				});
			}

			utils.task.getAllByProjectId.setData(
				{ projectId, isTemplate: actualIsTemplate },
				newOptimisticTasks
			);

			setOptimisticTasks(newOptimisticTasks);

			if (updateTaskOrders) {
				updateTaskOrders(updates);
			}
		},
		[currentTasks, utils, projectId, actualIsTemplate, updateTaskOrders]
	);

	return {
		columns,
		isLoading,
		moveTask
	};
}
