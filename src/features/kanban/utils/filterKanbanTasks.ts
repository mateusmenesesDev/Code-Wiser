import type { TaskPriorityEnum } from '@prisma/client';

type KanbanTaskFilters = {
	sprint: string;
	epic: string;
	productVersion?: string;
	priority?: TaskPriorityEnum;
	assignee: string;
	search: string;
};

export type FilterableKanbanTask = {
	title: string;
	sprint?: { id: string } | null;
	sprintId?: string | null;
	epic?: { id: string } | null;
	epicId?: string | null;
	productVersionId?: string | null;
	priority?: TaskPriorityEnum | null;
	assignees?: { id: string }[] | null;
};

export function filterKanbanTasks<T extends FilterableKanbanTask>(
	tasks: T[] | undefined,
	filters: KanbanTaskFilters
) {
	const search = filters.search.trim().toLowerCase();

	return (tasks ?? []).filter((task) => {
		if (
			filters.sprint !== 'all' &&
			(task.sprint?.id ?? task.sprintId) !== filters.sprint
		) {
			return false;
		}
		if (
			filters.epic !== 'all' &&
			(task.epic?.id ?? task.epicId) !== filters.epic
		) {
			return false;
		}
		if (
			filters.productVersion &&
			filters.productVersion !== 'all' &&
			task.productVersionId !== filters.productVersion
		) {
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
