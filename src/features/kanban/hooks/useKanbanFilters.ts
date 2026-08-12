import type { TaskPriorityEnum } from '@prisma/client';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import type { KanbanDataOutput } from '~/server/api/routers/kanban/types';
import { filterKanbanTasks } from '../utils/filterKanbanTasks';

export const useKanbanFilters = () => {
	const [kanbanFilters, setKanbanFilters] = useQueryStates({
		sprint: parseAsString.withDefault('all'),
		priority: parseAsString.withDefault('all'),
		assignee: parseAsString.withDefault('all'),
		search: parseAsString.withDefault('')
	});

	const sprint = kanbanFilters.sprint;
	const priority =
		kanbanFilters.priority === 'all'
			? undefined
			: (kanbanFilters.priority as TaskPriorityEnum);
	const assignee = kanbanFilters.assignee;
	const search = kanbanFilters.search;

	const hasActiveFilters = useMemo(() => {
		return (
			sprint !== 'all' ||
			priority !== undefined ||
			assignee !== 'all' ||
			search.trim() !== ''
		);
	}, [sprint, priority, assignee, search]);

	return {
		sprintFilter: sprint,
		priorityFilter: priority,
		assigneeFilter: assignee,
		searchFilter: search,
		setSprintFilter: (sprint: string) => {
			setKanbanFilters({
				...kanbanFilters,
				sprint: sprint
			});
		},
		setPriorityFilter: (priority: TaskPriorityEnum | 'all') => {
			setKanbanFilters({
				...kanbanFilters,
				priority: priority
			});
		},
		setAssigneeFilter: (assignee: string) => {
			setKanbanFilters({
				...kanbanFilters,
				assignee: assignee
			});
		},
		setSearchFilter: (search: string) => {
			setKanbanFilters({
				...kanbanFilters,
				search
			});
		},
		clearFilters: () => {
			setKanbanFilters({
				sprint: 'all',
				priority: 'all',
				assignee: 'all',
				search: ''
			});
		},
		hasActiveFilters,
		filterTasks: (tasks: KanbanDataOutput | undefined) =>
			filterKanbanTasks(tasks, {
				sprint,
				priority,
				assignee,
				search
			})
	};
};
