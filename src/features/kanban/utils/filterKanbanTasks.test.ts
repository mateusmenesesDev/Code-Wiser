import { TaskPriorityEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { filterKanbanTasks } from './filterKanbanTasks';

const tasks = [
	{
		title: 'Build task search',
		sprint: { id: 'sprint-1' },
		priority: TaskPriorityEnum.HIGH,
		assignees: [{ id: 'user-1' }]
	},
	{
		title: 'Update documentation',
		sprint: { id: 'sprint-2' },
		priority: TaskPriorityEnum.LOW,
		assignees: [{ id: 'user-2' }]
	}
];

describe('filterKanbanTasks', () => {
	it('matches task titles case-insensitively and ignores surrounding whitespace', () => {
		expect(
			filterKanbanTasks(tasks, {
				sprint: 'all',
				priority: undefined,
				assignee: 'all',
				search: '  SEARCH '
			})
		).toEqual([tasks[0]]);
	});

	it('combines search with the existing task filters', () => {
		expect(
			filterKanbanTasks(tasks, {
				sprint: 'sprint-1',
				priority: TaskPriorityEnum.HIGH,
				assignee: 'user-1',
				search: 'task'
			})
		).toEqual([tasks[0]]);

		expect(
			filterKanbanTasks(tasks, {
				sprint: 'sprint-1',
				priority: undefined,
				assignee: 'all',
				search: 'documentation'
			})
		).toEqual([]);
	});
});
