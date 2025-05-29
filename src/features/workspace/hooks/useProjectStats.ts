import { useMemo } from 'react';
import type { RouterOutputs } from '~/trpc/react';

type KanbanColumn = RouterOutputs['kanban']['getColumnsByProjectSlug'][number];

export function useProjectStats(columns?: KanbanColumn[]) {
	return useMemo(() => {
		if (!columns) {
			return {
				totalTasks: 0,
				completedTasks: 0,
				inProgressTasks: 0,
				progressPercentage: 0
			};
		}

		const allTasks = columns.flatMap((column) => column.tasks);
		const totalTasks = allTasks.length;

		// Count completed tasks (assuming 'Done' column type)
		const completedTasks = columns
			.filter((column) => column.columnType === 'DONE')
			.flatMap((column) => column.tasks).length;

		// Count in-progress tasks
		const inProgressTasks = columns
			.filter((column) => column.columnType === 'IN_PROGRESS')
			.flatMap((column) => column.tasks).length;

		// Calculate progress percentage
		const progressPercentage =
			totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

		return {
			totalTasks,
			completedTasks,
			inProgressTasks,
			progressPercentage
		};
	}, [columns]);
}
