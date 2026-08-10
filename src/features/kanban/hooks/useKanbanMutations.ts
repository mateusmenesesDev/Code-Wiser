import { applyTaskOrderUpdates } from '~/common/utils/kanbanReorder';
import { api } from '~/trpc/react';

export const useKanbanMutations = (projectId: string) => {
	const utils = api.useUtils();
	const updateTaskOrdersMutation = api.task.updateTaskOrders.useMutation({
		onMutate: async ({ updates }) => {
			// Cancel any outgoing refetches
			await utils.kanban.getKanbanData.cancel({ projectId });

			// Snapshot the previous value
			const previousTasks = utils.kanban.getKanbanData.getData({ projectId });

			// Optimistically update to the new value
			if (previousTasks) {
				utils.kanban.getKanbanData.setData(
					{ projectId },
					applyTaskOrderUpdates(previousTasks, updates)
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
		}
	});

	return {
		updateTaskOrdersMutation
	};
};
