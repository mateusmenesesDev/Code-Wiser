import { describe, expect, it } from 'vitest';
import {
	KANBAN_RANK_STEP,
	buildBulkTaskOrderUpdateSql,
	buildKanbanRankRebalanceSql,
	calculateKanbanRank,
	selectChangedTaskOrderUpdates
} from './taskOrderUpdates';

describe('selectChangedTaskOrderUpdates', () => {
	it('keeps only updates that change order or status', () => {
		const currentById = new Map([
			['a', { id: 'a', order: 0, status: 'TODO', projectId: 'p1' }],
			['b', { id: 'b', order: 1, status: 'TODO', projectId: 'p1' }],
			['c', { id: 'c', order: 0, status: 'IN_PROGRESS', projectId: 'p1' }]
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

describe('calculateKanbanRank', () => {
	it('allocates ranks at the beginning, end, and between cards', () => {
		expect(calculateKanbanRank(null, null)).toBe(KANBAN_RANK_STEP);
		expect(calculateKanbanRank(null, 2_000_000n)).toBe(1_000_000n);
		expect(calculateKanbanRank(2_000_000n, null)).toBe(3_000_000n);
		expect(calculateKanbanRank(1_000_000n, 3_000_000n)).toBe(2_000_000n);
	});

	it('requests a rebalance when there is no integer gap', () => {
		expect(calculateKanbanRank(1_000_000n, 1_000_001n)).toBeNull();
	});
});

describe('buildKanbanRankRebalanceSql', () => {
	it('uses deterministic ordering inside one project and status', () => {
		const sql = buildKanbanRankRebalanceSql('project-1', 'TODO');

		expect(sql.sql).toContain('ROW_NUMBER() OVER');
		expect(sql.sql).toContain('"projectId"');
		expect(sql.sql).toContain('"kanbanRank"');
		expect(sql.values).toEqual(['project-1', 'TODO']);
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
