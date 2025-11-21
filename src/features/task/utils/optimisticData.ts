import type { api } from '~/trpc/react';
import type { RouterOutputs } from '~/trpc/react';
import type {
	CreateTaskInput,
	UpdateTaskInput
} from '../../workspace/types/Task.type';
import { convertUndefinedToNull } from '~/common/utils/convertion';
import {
	createOptimisticKanbanTask,
	createOptimisticBacklogTask,
	createOptimisticHelpers
} from './optimisticDataHelpers';

type Utils = ReturnType<typeof api.useUtils>;

export type OptimisticUpdateConfig = {
	updateBacklog?: boolean;
	updateKanban?: boolean;
	updateGetById?: boolean;
};

export type DeleteTaskData = {
	taskId?: string;
	taskIds?: string[];
};

export type OptimisticUpdateContext = {
	previousBacklogData?: RouterOutputs['task']['getAllByProjectId'];
	previousKanbanData?: RouterOutputs['kanban']['getKanbanData'];
	previousGetByIdData?: RouterOutputs['task']['getById'];
	config: OptimisticUpdateConfig;
};

/**
 * Cancel queries based on config
 */
const cancelQueries = (
	utils: Utils,
	config: OptimisticUpdateConfig,
	projectId: string,
	isTemplate: boolean,
	taskId?: string
) => {
	if (config.updateBacklog) {
		utils.task.getAllByProjectId.cancel({ projectId, isTemplate });
	}
	if (config.updateKanban) {
		utils.kanban.getKanbanData.cancel({ projectId });
	}
	if (config.updateGetById && taskId) {
		utils.task.getById.cancel({ id: taskId });
	}
};

/**
 * Get previous data for rollback
 */
const getPreviousData = (
	helpers: ReturnType<typeof createOptimisticHelpers>,
	config: OptimisticUpdateConfig,
	projectId: string,
	isTemplate: boolean,
	taskId?: string
) => {
	const previous: {
		previousBacklogData?: RouterOutputs['task']['getAllByProjectId'];
		previousKanbanData?: RouterOutputs['kanban']['getKanbanData'];
		previousGetByIdData?: RouterOutputs['task']['getById'];
	} = {};

	if (config.updateBacklog) {
		previous.previousBacklogData = helpers.getPreviousBacklogData(
			projectId,
			isTemplate
		);
	}
	if (config.updateKanban) {
		previous.previousKanbanData = helpers.getPreviousKanbanData(projectId);
	}
	if (config.updateGetById && taskId) {
		previous.previousGetByIdData = helpers.getPreviousGetByIdData(taskId);
	}

	return previous;
};

/**
 * Apply optimistic updates for create operation
 */
const applyCreateUpdates = (
	helpers: ReturnType<typeof createOptimisticHelpers>,
	config: OptimisticUpdateConfig,
	projectId: string,
	isTemplate: boolean,
	data: CreateTaskInput
) => {
	if (config.updateKanban) {
		const optimisticKanbanTask = createOptimisticKanbanTask(data);
		helpers.setOptimisticKanbanData(projectId, optimisticKanbanTask);
	}

	if (config.updateBacklog) {
		const optimisticBacklogTask = createOptimisticBacklogTask(
			data,
			projectId,
			isTemplate
		);
		helpers.setOptimisticBacklogData(
			projectId,
			isTemplate,
			optimisticBacklogTask
		);
	}
};

/**
 * Apply optimistic updates for update operation
 */
const applyUpdateUpdates = (
	helpers: ReturnType<typeof createOptimisticHelpers>,
	config: OptimisticUpdateConfig,
	projectId: string,
	isTemplate: boolean,
	taskId: string,
	data: UpdateTaskInput
) => {
	const updates = convertUndefinedToNull(data, ['epicId', 'sprintId']);

	if (config.updateKanban) {
		helpers.updateOptimisticKanbanData(projectId, taskId, updates);
	}
	if (config.updateBacklog) {
		helpers.updateOptimisticBacklogData(projectId, isTemplate, taskId, updates);
	}
	if (config.updateGetById) {
		helpers.updateOptimisticGetByIdData(taskId, updates);
	}
};

/**
 * Apply optimistic updates for delete operation
 */
const applyDeleteUpdates = (
	utils: Utils,
	config: OptimisticUpdateConfig,
	projectId: string,
	taskId: string
) => {
	if (config.updateKanban) {
		utils.kanban.getKanbanData.setData({ projectId }, (old) => {
			if (!old) return old;
			return old
				.map((task) => (task.id === taskId ? null : task))
				.filter((task) => task !== null);
		});
	}
	if (config.updateGetById) {
		utils.task.getById.setData({ id: taskId }, () => null);
	}
};

/**
 * Apply optimistic updates for bulkDelete operation
 */
const applyBulkDeleteUpdates = (
	utils: Utils,
	config: OptimisticUpdateConfig,
	projectId: string,
	isTemplate: boolean,
	taskIds: string[]
) => {
	if (config.updateKanban && taskIds.length > 0) {
		utils.kanban.getKanbanData.setData({ projectId }, (old) => {
			if (!old) return old;
			return old.filter((task) => !taskIds.includes(task.id));
		});
	}

	if (config.updateBacklog && taskIds.length > 0) {
		utils.task.getAllByProjectId.setData({ projectId, isTemplate }, (old) => {
			if (!old) return old;
			return old.filter((task) => !taskIds.includes(task.id));
		});
	}
};

/**
 * Centralized function to handle optimistic updates for task mutations
 * Handles cancellation, getting previous data, and applying optimistic updates
 */
export const updateOptimisticData = ({
	utils,
	projectId,
	isTemplate,
	taskId,
	config,
	data,
	operation
}: {
	utils: Utils;
	projectId: string;
	isTemplate: boolean;
	taskId?: string;
	config: OptimisticUpdateConfig;
	data?: CreateTaskInput | UpdateTaskInput | DeleteTaskData;
	operation: 'create' | 'update' | 'delete' | 'bulkDelete';
}): OptimisticUpdateContext => {
	const helpers = createOptimisticHelpers({ utils });

	// Cancel queries
	cancelQueries(utils, config, projectId, isTemplate, taskId);

	// Get previous data for rollback
	const previous = getPreviousData(
		helpers,
		config,
		projectId,
		isTemplate,
		taskId
	);

	// Apply optimistic updates based on operation
	if (operation === 'create' && data) {
		applyCreateUpdates(
			helpers,
			config,
			projectId,
			isTemplate,
			data as CreateTaskInput
		);
	} else if (operation === 'update' && taskId && data) {
		applyUpdateUpdates(
			helpers,
			config,
			projectId,
			isTemplate,
			taskId,
			data as UpdateTaskInput
		);
	} else if (operation === 'delete' && taskId) {
		applyDeleteUpdates(utils, config, projectId, taskId);
	} else if (operation === 'bulkDelete' && data) {
		const deleteData = data as DeleteTaskData;
		const taskIds = deleteData.taskIds || [];
		applyBulkDeleteUpdates(utils, config, projectId, isTemplate, taskIds);
	}

	return { ...previous, config };
};

/**
 * Rollback optimistic updates on error
 */
export const rollbackOptimisticData = ({
	utils,
	context,
	projectId,
	isTemplate,
	taskId
}: {
	utils: Utils;
	context?: OptimisticUpdateContext;
	projectId: string;
	isTemplate: boolean;
	taskId?: string;
}): void => {
	if (!context) return;

	if (context.config.updateBacklog && context.previousBacklogData) {
		utils.task.getAllByProjectId.setData(
			{ projectId, isTemplate },
			context.previousBacklogData
		);
	}

	if (context.config.updateKanban && context.previousKanbanData) {
		utils.kanban.getKanbanData.setData(
			{ projectId },
			context.previousKanbanData
		);
	}

	if (context.config.updateGetById && context.previousGetByIdData && taskId) {
		utils.task.getById.setData({ id: taskId }, context.previousGetByIdData);
	}
};
