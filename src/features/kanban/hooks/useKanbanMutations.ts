import type { TaskStatusEnum } from '@prisma/client';
import { applyKanbanMove } from '~/common/utils/kanbanReorder';
import { api } from '~/trpc/react';
import { boardColumns } from '../constants';

export const useKanbanMutations = (projectId: string) => {
	const utils = api.useUtils();
	const moveTaskMutation = api.task.moveTask.useMutation({
		onMutate: async (move) => {
			// Cancel any outgoing refetches
			await utils.kanban.getKanbanData.cancel({ projectId });

			// Snapshot the previous value
			const previousTasks = utils.kanban.getKanbanData.getData({ projectId });

			// Optimistically update to the new value
			if (previousTasks) {
				utils.kanban.getKanbanData.setData(
					{ projectId },
					applyKanbanMove(
						previousTasks,
						{ ...move, beforeTaskId: move.beforeTaskId ?? null },
						boardColumns.map((column) => column.id as TaskStatusEnum)
					)
				);
			}

			return { previousTasks };
		},
		onError: (_error, _variables, context) => {
			// Rollback to the previous value on error
			if (context?.previousTasks) {
				utils.kanban.getKanbanData.setData(
					{ projectId },
					context.previousTasks
				);
			}
		},
		onSettled: () => {
			utils.kanban.getKanbanData.invalidate({ projectId });
			utils.project.getRoadmap.invalidate({ projectId });
		}
	});

	return {
		moveTaskMutation
	};
};
