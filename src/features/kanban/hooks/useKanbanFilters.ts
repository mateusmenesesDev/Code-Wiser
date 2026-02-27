import type { TaskPriorityEnum } from '@prisma/client';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import type { KanbanDataOutput } from '~/server/api/routers/kanban/types';

export const useKanbanFilters = () => {
	const [kanbanFilters, setKanbanFilters] = useQueryStates({
		sprint: parseAsString.withDefault('all'),
		priority: parseAsString.withDefault('all'),
		assignee: parseAsString.withDefault('all')
	});

	const sprint = kanbanFilters.sprint;
	const priority =
		kanbanFilters.priority === 'all'
			? undefined
			: (kanbanFilters.priority as TaskPriorityEnum);
	const assignee = kanbanFilters.assignee;

	const hasActiveFilters = useMemo(() => {
		return sprint !== 'all' || priority !== undefined || assignee !== 'all';
	}, [sprint, priority, assignee]);

	const filterTasks = (tasks: KanbanDataOutput | undefined) => {
		if (!tasks) return [];
		return tasks.filter((task) => {
			if (sprint !== 'all' && task.sprint?.id !== sprint) return false;
			if (priority && task.priority !== priority) return false;
			if (assignee !== 'all' && task.assignee?.id !== assignee) return false;
			return true;
		});
	};

	return {
		sprintFilter: sprint,
		priorityFilter: priority,
		assigneeFilter: assignee,
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
		clearFilters: () => {
			setKanbanFilters({
				sprint: 'all',
				priority: 'all',
				assignee: 'all'
			});
		},
		hasActiveFilters,
		filterTasks
	};
};
