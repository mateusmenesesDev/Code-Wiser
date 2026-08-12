import type { TaskPriorityEnum } from '@prisma/client';

type KanbanTaskFilters = {
	sprint: string;
	priority?: TaskPriorityEnum;
	assignee: string;
	search: string;
};

type FilterableKanbanTask = {
	title: string;
	sprint?: { id: string } | null;
	priority?: TaskPriorityEnum | null;
	assignees?: { id: string }[] | null;
};

export function filterKanbanTasks<T extends FilterableKanbanTask>(
	tasks: T[] | undefined,
	filters: KanbanTaskFilters
) {
	const search = filters.search.trim().toLowerCase();

	return (tasks ?? []).filter((task) => {
		if (filters.sprint !== 'all' && task.sprint?.id !== filters.sprint) {
			return false;
		}
		if (filters.priority && task.priority !== filters.priority) return false;
		if (
			filters.assignee !== 'all' &&
			!(task.assignees ?? []).some(
				(assignee) => assignee.id === filters.assignee
			)
		) {
			return false;
		}
		if (search && !task.title.toLowerCase().includes(search)) return false;

		return true;
	});
}
