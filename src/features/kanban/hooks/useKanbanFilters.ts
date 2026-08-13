import type { TaskPriorityEnum } from '@prisma/client';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import {
	filterKanbanTasks,
	type FilterableKanbanTask
} from '../utils/filterKanbanTasks';

export const useKanbanFilters = () => {
	const [kanbanFilters, setKanbanFilters] = useQueryStates({
		sprint: parseAsString.withDefault('all'),
		epic: parseAsString.withDefault('all'),
		priority: parseAsString.withDefault('all'),
		assignee: parseAsString.withDefault('all'),
		search: parseAsString.withDefault('')
	});

	const sprint = kanbanFilters.sprint;
	const epic = kanbanFilters.epic;
	const priority =
		kanbanFilters.priority === 'all'
			? undefined
			: (kanbanFilters.priority as TaskPriorityEnum);
	const assignee = kanbanFilters.assignee;
	const search = kanbanFilters.search;

	const hasActiveFilters = useMemo(() => {
		return (
			sprint !== 'all' ||
			epic !== 'all' ||
			priority !== undefined ||
			assignee !== 'all' ||
			search.trim() !== ''
		);
	}, [sprint, epic, priority, assignee, search]);

	return {
		sprintFilter: sprint,
		epicFilter: epic,
		priorityFilter: priority,
		assigneeFilter: assignee,
		searchFilter: search,
		setSprintFilter: (sprint: string) => {
			setKanbanFilters({
				...kanbanFilters,
				sprint: sprint
			});
		},
		setEpicFilter: (epic: string) => {
			setKanbanFilters({
				...kanbanFilters,
				epic
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
				epic: 'all',
				priority: 'all',
				assignee: 'all',
				search: ''
			});
		},
		hasActiveFilters,
		filterTasks: <T extends FilterableKanbanTask>(tasks: T[] | undefined) =>
			filterKanbanTasks(tasks, {
				sprint,
				epic,
				priority,
				assignee,
				search
			})
	};
};
