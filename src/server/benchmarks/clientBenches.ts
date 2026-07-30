import {
	groupTasksBySprintId,
	reorderKanbanItems,
	toKanbanOrderUpdates
} from '~/common/utils/kanbanReorder';
import {
	type SampleSummary,
	measureSync,
	summarizeSamples
} from './measure';
import {
	type StressScale,
	createInMemoryStressFixture,
	resolveStressScale
} from './stressFixture';

const COLUMN_IDS = [
	'BACKLOG',
	'READY_TO_DEVELOP',
	'IN_PROGRESS',
	'CODE_REVIEW',
	'TESTING',
	'DONE'
] as const;

export type ClientBenchReport = {
	scale: Pick<StressScale, 'boardTasks'>;
	iterations: number;
	benches: {
		reorderKanban: SampleSummary;
		toKanbanOrderUpdates: SampleSummary;
		groupBySprint: SampleSummary;
	};
};

export function runClientBenches(options?: {
	boardTasks?: number;
	iterations?: number;
}): ClientBenchReport {
	const scale = resolveStressScale({
		boardTasks: options?.boardTasks
	});
	const iterations = options?.iterations ?? 25;
	const fixture = createInMemoryStressFixture({
		templates: 1,
		tasksPerTemplate: 1,
		enrolledProjects: 1,
		boardTasks: scale.boardTasks
	});

	const board = fixture.boardTasks;
	const activeId = board[0]?.id ?? '';
	const overId = board[Math.floor(board.length / 2)]?.id ?? activeId;

	const reorderSamples: number[] = [];
	const orderUpdateSamples: number[] = [];
	const groupSamples: number[] = [];

	for (let i = 0; i < iterations; i++) {
		const reorder = measureSync(() =>
			reorderKanbanItems(board, activeId, overId, COLUMN_IDS, 'before')
		);
		reorderSamples.push(reorder.durationMs);

		const orderUpdates = measureSync(() =>
			toKanbanOrderUpdates(reorder.result)
		);
		orderUpdateSamples.push(orderUpdates.durationMs);

		const grouped = measureSync(() => groupTasksBySprintId(board));
		groupSamples.push(grouped.durationMs);
	}

	return {
		scale: { boardTasks: scale.boardTasks },
		iterations,
		benches: {
			reorderKanban: summarizeSamples(reorderSamples),
			toKanbanOrderUpdates: summarizeSamples(orderUpdateSamples),
			groupBySprint: summarizeSamples(groupSamples)
		}
	};
}
