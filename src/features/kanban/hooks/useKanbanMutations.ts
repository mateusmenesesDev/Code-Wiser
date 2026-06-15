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
				const updatesById = new Map(
					updates.map((update) => [update.id, update])
				);
				const optimisticTasks = previousTasks
					.map((task) => {
						const update = updatesById.get(task.id);
						if (!update) return task;

						return {
							...task,
							order: update.order,
							status: update.status as TaskStatusEnum
						};
					})
					.sort((a, b) => {
						const statusOrder = String(a.status).localeCompare(
							String(b.status)
						);
						if (statusOrder !== 0) return statusOrder;
						return (a.order ?? 0) - (b.order ?? 0);
					});

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
