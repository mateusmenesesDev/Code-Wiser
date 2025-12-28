import { TaskStatusEnum } from '@prisma/client';
import { convertUndefinedToNull } from '~/common/utils/convertion';
import type { api } from '~/trpc/react';
import type { RouterOutputs } from '~/trpc/react';
import type { CreateTaskInput } from '../../workspace/types/Task.type';

type KanbanTask = RouterOutputs['kanban']['getKanbanData'][number];
type BacklogTask = RouterOutputs['task']['getAllByProjectId'][number];
type Utils = ReturnType<typeof api.useUtils>;

export type InvalidateDataReturn = {
	invalidateBacklogData: () => void;
	invalidateKanbanData: () => void;
	invalidateTaskById: (taskId: string) => void;
};

export type OptimisticDataHelpers = {
	getPreviousKanbanData: (projectId: string) => KanbanTask[] | undefined;
	getPreviousGetByIdData: (
		taskId: string
	) => RouterOutputs['task']['getById'] | undefined;
	getPreviousBacklogData: (
		projectId: string,
		isTemplate: boolean
	) => BacklogTask[] | undefined;
	setOptimisticKanbanData: (
		projectId: string,
		optimisticTask: KanbanTask
	) => void;
	setOptimisticBacklogData: (
		projectId: string,
		isTemplate: boolean,
		optimisticTask: BacklogTask
	) => void;
	updateOptimisticKanbanData: (
		projectId: string,
		taskId: string,
		updates: Partial<KanbanTask>
	) => void;
	updateOptimisticBacklogData: (
		projectId: string,
		isTemplate: boolean,
		taskId: string,
		updates: Partial<BacklogTask>
	) => void;
	updateOptimisticGetByIdData: (
		taskId: string,
		updates: Partial<RouterOutputs['task']['getById']>
	) => void;
};

/**
 * Creates helper functions to invalidate task-related queries
 */
export const createInvalidateHelpers = ({
	projectId,
	isTemplate,
	utils
}: {
	projectId?: string;
	isTemplate: boolean;
	utils: Utils;
}): InvalidateDataReturn => {
	return {
		invalidateBacklogData: () =>
			utils.task.getAllByProjectId.invalidate({ projectId, isTemplate }),
		invalidateKanbanData: () =>
			utils.kanban.getKanbanData.invalidate({ projectId }),
		invalidateTaskById: (taskId: string) =>
			utils.task.getById.invalidate({ id: taskId })
	};
};

/**
 * Creates helper functions for optimistic updates
 */
export const createOptimisticHelpers = ({
	utils
}: {
	utils: Utils;
}): OptimisticDataHelpers => {
	const getPreviousKanbanData = (projectId: string) => {
		return utils.kanban.getKanbanData.getData({ projectId });
	};

	const getPreviousGetByIdData = (taskId: string) => {
		return utils.task.getById.getData({ id: taskId });
	};

	const getPreviousBacklogData = (projectId: string, isTemplate: boolean) => {
		return utils.task.getAllByProjectId.getData({
			projectId,
			isTemplate
		});
	};

	const setOptimisticKanbanData = (
		projectId: string,
		optimisticTask: KanbanTask
	) => {
		utils.kanban.getKanbanData.setData({ projectId }, (old) => {
			if (!old) return old;
			return [...old, optimisticTask];
		});
	};

	const setOptimisticBacklogData = (
		projectId: string,
		isTemplate: boolean,
		optimisticTask: BacklogTask
	) => {
		utils.task.getAllByProjectId.setData({ projectId, isTemplate }, (old) => {
			if (!old) return old;
			return [...old, optimisticTask];
		});
	};

	const updateOptimisticKanbanData = (
		projectId: string,
		taskId: string,
		updates: Partial<KanbanTask>
	) => {
		utils.kanban.getKanbanData.setData({ projectId }, (old) => {
			if (!old) return old;
			return old.map((task) => {
				if (task.id === taskId) {
					return { ...task, ...updates };
				}
				return task;
			});
		});
	};

	const updateOptimisticBacklogData = (
		projectId: string,
		isTemplate: boolean,
		taskId: string,
		updates: Partial<BacklogTask>
	) => {
		utils.task.getAllByProjectId.setData({ projectId, isTemplate }, (old) => {
			if (!old) return old;
			return old.map((task) => {
				if (task.id === taskId) {
					return { ...task, ...updates };
				}
				return task;
			});
		});
	};

	const updateOptimisticGetByIdData = (
		taskId: string,
		updates: Partial<RouterOutputs['task']['getById']>
	) => {
		utils.task.getById.setData({ id: taskId }, (old) => {
			if (!old) return old;
			return { ...old, ...updates };
		});
	};

	return {
		getPreviousKanbanData,
		getPreviousGetByIdData,
		getPreviousBacklogData,
		setOptimisticKanbanData,
		setOptimisticBacklogData,
		updateOptimisticKanbanData,
		updateOptimisticBacklogData,
		updateOptimisticGetByIdData
	};
};

/**
 * Creates an optimistic kanban task from a CreateTaskInput
 */
export const createOptimisticKanbanTask = (
	newTask: CreateTaskInput
): KanbanTask => {
	return {
		id: '-1',
		title: newTask.title,
		status: newTask.status || TaskStatusEnum.BACKLOG,
		priority: newTask.priority || null,
		order: null,
		sprint: null,
		epic: null,
		assignee: null
	};
};

/**
 * Creates an optimistic backlog task from a CreateTaskInput
 */
export const createOptimisticBacklogTask = (
	newTask: CreateTaskInput,
	projectId: string | undefined,
	isTemplate: boolean
): BacklogTask => {
	return {
		...convertUndefinedToNull(newTask, ['epicId', 'sprintId']),
		id: '-1',
		createdAt: new Date(),
		updatedAt: new Date(),
		projectId: isTemplate ? null : (projectId ?? null),
		projectTemplateId: isTemplate ? (projectId ?? null) : null,
		kanbanColumn: null,
		assignee: null,
		sprint: null,
		epic: null,
		type: newTask.type || null,
		status: newTask.status || TaskStatusEnum.BACKLOG,
		order: null,
		description: newTask.description || null,
		priority: newTask.priority || null,
		tags: newTask.tags || [],
		blocked: newTask.blocked || false,
		blockedReason: newTask.blockedReason || null,
		dueDate: newTask.dueDate || null,
		storyPoints: newTask.storyPoints || null,
		epicId: newTask.epicId || null,
		sprintId: newTask.sprintId || null,
		assigneeId: newTask.assigneeId || null
	} as BacklogTask;
};
