import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import type { ProjectListSprint, ProjectListTask } from './projectListView';
import { groupProjectListTasks, sortProjectListTasks } from './projectListView';

const task = (
	id: string,
	overrides: Partial<ProjectListTask> = {}
): ProjectListTask =>
	({
		id,
		title: id,
		status: TaskStatusEnum.BACKLOG,
		order: 0,
		priority: null,
		type: TaskTypeEnum.TASK,
		storyPoints: null,
		publicNumber: null,
		createdAt: new Date('2025-01-01T00:00:00.000Z'),
		project: { publicCode: 'CW' },
		assignees: [],
		sprint: null,
		epic: null,
		...overrides
	}) as ProjectListTask;

const sprints: ProjectListSprint[] = [
	{ id: 'sprint-1', title: 'Sprint 1', order: 0 },
	{ id: 'sprint-2', title: 'Sprint 2', order: 1 }
];

describe('project list view', () => {
	it('keeps every status group visible, including empty groups', () => {
		const groups = groupProjectListTasks(
			[task('backlog-task')],
			'status',
			sprints
		);

		expect(groups).toHaveLength(6);
		expect(groups.map((group) => group.key)).toEqual([
			'BACKLOG',
			'READY_TO_DEVELOP',
			'IN_PROGRESS',
			'CODE_REVIEW',
			'TESTING',
			'DONE'
		]);
		expect(groups[0]?.tasks.map((item) => item.id)).toEqual(['backlog-task']);
		expect(groups[1]?.tasks).toEqual([]);
	});

	it('only includes sprints with visible tasks and always includes no sprint', () => {
		const groups = groupProjectListTasks(
			[
				task('sprint-2-task', {
					sprint: { id: 'sprint-2', title: 'Sprint 2', order: 1 }
				}),
				task('sprint-1-task', {
					sprint: { id: 'sprint-1', title: 'Sprint 1', order: 0 }
				}),
				task('unplanned-task')
			],
			'sprint',
			[...sprints].reverse()
		);

		expect(groups.map((group) => group.key)).toEqual([
			'sprint-1',
			'sprint-2',
			'NO_SPRINT'
		]);
		expect(groups[2]?.tasks.map((item) => item.id)).toEqual(['unplanned-task']);
	});

	it('sorts by title in both directions without changing the input', () => {
		const tasks = [task('Bravo'), task('Alpha')];

		expect(
			sortProjectListTasks(tasks, 'title', 'asc').map((item) => item.title)
		).toEqual(['Alpha', 'Bravo']);
		expect(
			sortProjectListTasks(tasks, 'title', 'desc').map((item) => item.title)
		).toEqual(['Bravo', 'Alpha']);
		expect(tasks.map((item) => item.title)).toEqual(['Bravo', 'Alpha']);
	});

	it('uses manual order as the stable tie-breaker', () => {
		const tasks = [
			task('later', { title: 'Same', order: 2 }),
			task('earlier', { title: 'Same', order: 1 })
		];

		expect(
			sortProjectListTasks(tasks, 'title', 'desc').map((item) => item.id)
		).toEqual(['earlier', 'later']);
	});

	it('orders priority groups from highest to lowest', () => {
		const groups = groupProjectListTasks(
			[
				task('low-task', { priority: TaskPriorityEnum.LOW }),
				task('high-task', { priority: TaskPriorityEnum.HIGH })
			],
			'priority',
			sprints
		);

		expect(groups.map((group) => group.key)).toEqual([
			'HIGHEST',
			'HIGH',
			'MEDIUM',
			'LOW',
			'LOWEST',
			'NO_PRIORITY'
		]);
		expect(groups[1]?.tasks.map((item) => item.id)).toEqual(['high-task']);
	});
});
