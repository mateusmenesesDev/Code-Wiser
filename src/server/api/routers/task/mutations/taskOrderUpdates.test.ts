import { describe, expect, it } from 'vitest';
import {
	buildBulkTaskOrderUpdateSql,
	selectChangedTaskOrderUpdates
} from './taskOrderUpdates';

describe('selectChangedTaskOrderUpdates', () => {
	it('keeps only updates that change order or status', () => {
		const currentById = new Map([
			[
				'a',
				{ id: 'a', order: 0, status: 'TODO', projectId: 'p1' }
			],
			[
				'b',
				{ id: 'b', order: 1, status: 'TODO', projectId: 'p1' }
			],
			[
				'c',
				{ id: 'c', order: 0, status: 'IN_PROGRESS', projectId: 'p1' }
			]
		]);

		expect(
			selectChangedTaskOrderUpdates(
				[
					{ id: 'a', order: 0, status: 'TODO' },
					{ id: 'b', order: 0, status: 'TODO' },
					{ id: 'c', order: 0, status: 'DONE' }
				],
				currentById
			)
		).toEqual([
			{ id: 'b', order: 0, status: 'TODO' },
			{ id: 'c', order: 0, status: 'DONE' }
		]);
	});

	it('treats omitted status as unchanged', () => {
		const currentById = new Map([
			['a', { id: 'a', order: 1, status: 'TODO', projectId: 'p1' }]
		]);

		expect(
			selectChangedTaskOrderUpdates([{ id: 'a', order: 1 }], currentById)
		).toEqual([]);
	});
});

describe('buildBulkTaskOrderUpdateSql', () => {
	it('builds a single UPDATE ... FROM VALUES statement', () => {
		const sql = buildBulkTaskOrderUpdateSql([
			{ id: 'task-1', order: 0, status: 'TODO' },
			{ id: 'task-2', order: 1 }
		]);

		expect(sql.sql).toContain('UPDATE "Task"');
		expect(sql.sql).toContain('VALUES');
		expect(sql.values).toEqual(['task-1', 0, 'TODO', 'task-2', 1, null]);
	});
});
