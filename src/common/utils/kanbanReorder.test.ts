import { describe, expect, it } from 'vitest';
import {
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
});
