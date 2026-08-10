import { describe, expect, it } from 'vitest';
import {
	applyTaskOrderUpdates,
	bucketTasksByStatus,
	groupTasksBySprintId,
	mergeVisibleKanbanItems,
	removeTasksByIds,
	reorderKanbanItems,
	toKanbanOrderUpdates,
	toPerColumnOrderUpdates
} from './kanbanReorder';

const columns = ['TODO', 'IN_PROGRESS', 'DONE'];

const task = (id: string, status: string, order = 0) => ({ id, status, order });

const ids = (items: Array<{ id: string; status: string | null }>) =>
	items.map(({ id, status }) => ({ id, status }));

describe('kanban reorder', () => {
	it('generates order values per column', () => {
		const data = [
			task('todo-1', 'TODO'),
			task('progress-1', 'IN_PROGRESS'),
			task('todo-2', 'TODO'),
			task('progress-2', 'IN_PROGRESS')
		];

		expect(toPerColumnOrderUpdates(data)).toEqual([
			{ id: 'todo-1', order: 0, status: 'TODO' },
			{ id: 'progress-1', order: 0, status: 'IN_PROGRESS' },
			{ id: 'todo-2', order: 1, status: 'TODO' },
			{ id: 'progress-2', order: 1, status: 'IN_PROGRESS' }
		]);
	});

	it('moves a cross-column card before the target card', () => {
		const result = reorderKanbanItems(
			[
				task('todo-1', 'TODO'),
				task('todo-2', 'TODO'),
				task('progress-1', 'IN_PROGRESS'),
				task('progress-2', 'IN_PROGRESS')
			],
			'todo-1',
			'progress-2',
			columns,
			'before'
		);

		expect(ids(result)).toEqual([
			{ id: 'todo-2', status: 'TODO' },
			{ id: 'progress-1', status: 'IN_PROGRESS' },
			{ id: 'todo-1', status: 'IN_PROGRESS' },
			{ id: 'progress-2', status: 'IN_PROGRESS' }
		]);
	});

	it('moves a cross-column card after the target card', () => {
		const result = reorderKanbanItems(
			[
				task('todo-1', 'TODO'),
				task('todo-2', 'TODO'),
				task('progress-1', 'IN_PROGRESS'),
				task('progress-2', 'IN_PROGRESS')
			],
			'todo-1',
			'progress-1',
			columns,
			'after'
		);

		expect(ids(result)).toEqual([
			{ id: 'todo-2', status: 'TODO' },
			{ id: 'progress-1', status: 'IN_PROGRESS' },
			{ id: 'todo-1', status: 'IN_PROGRESS' },
			{ id: 'progress-2', status: 'IN_PROGRESS' }
		]);
	});

	it('moves a same-column card to the last visual position', () => {
		const result = reorderKanbanItems(
			[task('todo-1', 'TODO'), task('todo-2', 'TODO'), task('todo-3', 'TODO')],
			'todo-1',
			'todo-3',
			columns,
			'before'
		);

		expect(ids(result)).toEqual([
			{ id: 'todo-2', status: 'TODO' },
			{ id: 'todo-3', status: 'TODO' },
			{ id: 'todo-1', status: 'TODO' }
		]);
	});

	it('drops onto a column empty area at the end of that column', () => {
		const result = reorderKanbanItems(
			[
				task('todo-1', 'TODO'),
				task('progress-1', 'IN_PROGRESS'),
				task('todo-2', 'TODO')
			],
			'progress-1',
			'TODO',
			columns
		);

		expect(ids(result)).toEqual([
			{ id: 'todo-1', status: 'TODO' },
			{ id: 'todo-2', status: 'TODO' },
			{ id: 'progress-1', status: 'TODO' }
		]);
	});

	it('preserves hidden filtered tasks while updating visible task order', () => {
		const allData = [
			task('visible-1', 'TODO', 0),
			task('hidden', 'TODO', 1),
			task('visible-2', 'TODO', 2)
		];
		const visibleData = [
			task('visible-2', 'TODO', 2),
			task('visible-1', 'TODO', 0)
		];

		expect(toKanbanOrderUpdates(allData, visibleData)).toEqual([
			{ id: 'visible-2', order: 0, status: 'TODO' },
			{ id: 'visible-1', order: 2, status: 'TODO' }
		]);
	});

	it('preserves hidden filtered tasks when moving a visible task between columns', () => {
		const allData = [
			task('todo-1', 'TODO', 0),
			task('hidden', 'TODO', 1),
			task('progress-1', 'IN_PROGRESS', 0)
		];
		const visibleData = [
			task('todo-1', 'TODO', 0),
			task('progress-1', 'TODO', 0)
		];

		expect(toKanbanOrderUpdates(allData, visibleData)).toEqual([
			{ id: 'progress-1', order: 2, status: 'TODO' }
		]);
	});

	it('merges visible order while keeping hidden ranks per status', () => {
		const allData = [
			task('visible-1', 'TODO', 0),
			task('hidden', 'TODO', 1),
			task('visible-2', 'TODO', 2)
		];
		const visibleData = [
			task('visible-2', 'TODO', 2),
			task('visible-1', 'TODO', 0)
		];

		expect(mergeVisibleKanbanItems(allData, visibleData).map((t) => t.id)).toEqual(
			['visible-2', 'hidden', 'visible-1']
		);
	});

	it('applies order updates with a Map in one pass', () => {
		const data = [
			task('a', 'TODO', 0),
			task('b', 'TODO', 1),
			task('c', 'IN_PROGRESS', 0)
		];

		expect(
			applyTaskOrderUpdates(data, [
				{ id: 'b', order: 0, status: 'IN_PROGRESS' },
				{ id: 'c', order: 1, status: 'IN_PROGRESS' }
			])
		).toEqual([
			task('b', 'IN_PROGRESS', 0),
			task('c', 'IN_PROGRESS', 1),
			task('a', 'TODO', 0)
		]);
	});

	it('buckets tasks by status in a single pass', () => {
		const buckets = bucketTasksByStatus([
			task('a', 'TODO'),
			task('b', 'IN_PROGRESS'),
			task('c', 'TODO')
		]);

		expect(buckets.get('TODO')?.map((t) => t.id)).toEqual(['a', 'c']);
		expect(buckets.get('IN_PROGRESS')?.map((t) => t.id)).toEqual(['b']);
	});

	it('groups tasks by sprint id in a single pass', () => {
		const groups = groupTasksBySprintId([
			{ id: 'a', sprintId: null },
			{ id: 'b', sprintId: 's1' },
			{ id: 'c', sprintId: 's1' },
			{ id: 'd', sprintId: null }
		]);

		expect(groups.get(null)?.map((t) => t.id)).toEqual(['a', 'd']);
		expect(groups.get('s1')?.map((t) => t.id)).toEqual(['b', 'c']);
	});

	it('removes tasks with a Set of ids', () => {
		expect(
			removeTasksByIds(
				[task('a', 'TODO'), task('b', 'TODO'), task('c', 'TODO')],
				['a', 'c']
			).map((t) => t.id)
		).toEqual(['b']);
	});
});
