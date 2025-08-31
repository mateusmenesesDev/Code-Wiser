import type { TaskPriorityEnum } from '@prisma/client';
import { useAtomValue, useSetAtom } from 'jotai';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { useProjectMembers } from '~/features/projects/hooks/useProjectMembers';
import { useSprintQueries } from '~/features/sprints/hooks/useSprintQueries';
import { allTasksAtom } from '../atoms/taskFiltersAtom';

const filtersSearchParams = {
	sprint: parseAsString.withDefault('all'),
	priority: parseAsString.withDefault('all'),
	assignee: parseAsString.withDefault('all')
};

export function useTaskFiltersUrl() {
	const { getAllSprints } = useSprintQueries();
	const [sprints] = getAllSprints();
	const { members } = useProjectMembers();
	const [filters, setFilters] = useQueryStates(filtersSearchParams);
	const allTasks = useAtomValue(allTasksAtom);

	const filterOptions = useMemo(() => {
		const priorities = Array.from(
			new Set(
				allTasks
					.map((task) => task.priority)
					.filter((priority): priority is TaskPriorityEnum => priority !== null)
			)
		);

		const assignees = members?.map((member) => ({
			assigneeId: member.id,
			name: member.name || member.email || ''
		}));

		return {
			sprints,
			priorities,
			assignees
		};
	}, [allTasks, sprints, members]);

	const filteredTasks = useMemo(() => {
		return allTasks.filter((task) => {
			const sprintMatch =
				filters.sprint === 'all' || task.sprintId === filters.sprint;
			const priorityMatch =
				filters.priority === 'all' || task.priority === filters.priority;
			const assigneeMatch =
				filters.assignee === 'all' || task.assigneeId === filters.assignee;

			return sprintMatch && priorityMatch && assigneeMatch;
		});
	}, [allTasks, filters]);

	const hasActiveFilters = useMemo(() => {
		return (
			filters.sprint !== 'all' ||
			filters.priority !== 'all' ||
			filters.assignee !== 'all'
		);
	}, [filters]);

	const updateFilter = (key: keyof typeof filters, value: string) => {
		setFilters({ [key]: value });
	};

	const clearFilters = () => {
		setFilters({
			sprint: 'all',
			priority: 'all',
			assignee: 'all'
		});
	};

	const totalTasks = allTasks.length;
	const filteredCount = filteredTasks.length;

	return {
		filters,
		filteredTasks,
		filterOptions,
		hasActiveFilters,
		updateFilter,
		clearFilters,
		totalTasks,
		filteredCount
	};
}

export function useSetAllTasks() {
	return useSetAtom(allTasksAtom);
}
