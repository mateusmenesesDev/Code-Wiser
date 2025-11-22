import type { TaskStatusEnum } from '@prisma/client';
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
				const tasksById = new Map(previousTasks.map((t) => [t.id, t]));

				// Create optimistic tasks in the order specified by updates
				const optimisticTasks = updates
					.map((update) => {
						const task = tasksById.get(update.id);
						if (!task) return null;
						return {
							...task,
							order: update.order,
							status: update.status as TaskStatusEnum
						};
					})
					.filter((t): t is NonNullable<typeof t> => t !== null);

				// Sort by order to maintain correct order
				optimisticTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

				utils.kanban.getKanbanData.setData({ projectId }, optimisticTasks);
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
