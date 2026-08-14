import { TaskPriorityEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { filterKanbanTasks } from './filterKanbanTasks';

const tasks = [
	{
		title: 'Build task search',
		sprint: { id: 'sprint-1' },
		priority: TaskPriorityEnum.HIGH,
		productVersionId: 'version-1',
		epic: { id: 'epic-1' },
		assignees: [{ id: 'user-1' }]
	},
	{
		title: 'Update documentation',
		sprint: { id: 'sprint-2' },
		epic: { id: 'epic-2' },
		priority: TaskPriorityEnum.LOW,
		productVersionId: 'version-2',
		assignees: [{ id: 'user-2' }]
	}
];

describe('filterKanbanTasks', () => {
	it('matches task titles case-insensitively and ignores surrounding whitespace', () => {
		expect(
			filterKanbanTasks(tasks, {
				sprint: 'all',
				epic: 'all',
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
				epic: 'epic-1',
				priority: TaskPriorityEnum.HIGH,
				assignee: 'user-1',
				search: 'task'
			})
		).toEqual([tasks[0]]);

		expect(
			filterKanbanTasks(tasks, {
				sprint: 'sprint-1',
				epic: 'all',
				priority: undefined,
				assignee: 'all',
				search: 'documentation'
			})
		).toEqual([]);
	});

	it('filters by product version together with the other task filters', () => {
		expect(
			filterKanbanTasks(tasks, {
				sprint: 'all',
				epic: 'all',
				productVersion: 'version-2',
				priority: undefined,
				assignee: 'all',
				search: ''
			})
		).toEqual([tasks[1]]);
	});

	it('filters by epic together with the other task filters', () => {
		expect(
			filterKanbanTasks(tasks, {
				sprint: 'all',
				epic: 'epic-2',
				priority: undefined,
				assignee: 'all',
				search: ''
			})
		).toEqual([tasks[1]]);
	});
});
