import { useMemo } from 'react';
import type { RouterOutputs } from '~/trpc/react';
import { useTaskFiltersUrl } from './useTaskFiltersUrl';

type KanbanColumn = RouterOutputs['kanban']['getColumnsByProjectSlug'][number];

export function useFilteredColumnsUrl(columns: KanbanColumn[] | undefined) {
	const { filteredTasks } = useTaskFiltersUrl();

	const filteredColumns = useMemo(() => {
		if (!columns) return undefined;

		return columns.map((column) => ({
			...column,
			tasks: column.tasks.filter((task) =>
				filteredTasks.some((filteredTask) => filteredTask.id === task.id)
			)
		}));
	}, [columns, filteredTasks]);

	return filteredColumns;
}
