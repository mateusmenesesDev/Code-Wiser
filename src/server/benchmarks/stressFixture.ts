export type StressScale = {
	templates: number;
	tasksPerTemplate: number;
	enrolledProjects: number;
	boardTasks: number;
	sprintsPerTemplate: number;
	epicsPerTemplate: number;
};

/** Documented default scale for performance baselines (Phase 1+). */
export const DEFAULT_STRESS_SCALE: StressScale = {
	templates: 20,
	tasksPerTemplate: 150,
	enrolledProjects: 12,
	boardTasks: 400,
	sprintsPerTemplate: 4,
	epicsPerTemplate: 3
};

export const STRESS_TITLE_PREFIX = '__PERF_STRESS__';

export type InMemoryStressTask = {
	id: string;
	status: string;
	order: number;
	sprintId: string | null;
	title: string;
};

export type InMemoryStressTemplate = {
	id: string;
	title: string;
	tasks: InMemoryStressTask[];
	sprints: Array<{ id: string; title: string }>;
	epics: Array<{ id: string; title: string }>;
};

export type InMemoryStressFixture = {
	scale: StressScale;
	templates: InMemoryStressTemplate[];
	enrolledProjectIds: string[];
	boardTasks: InMemoryStressTask[];
	totals: {
		templates: number;
		tasks: number;
		enrolledProjects: number;
		boardTasks: number;
	};
};

const STATUSES = [
	'BACKLOG',
	'READY_TO_DEVELOP',
	'IN_PROGRESS',
	'CODE_REVIEW',
	'TESTING',
	'DONE'
] as const;

export function resolveStressScale(
	overrides: Partial<StressScale> = {}
): StressScale {
	return { ...DEFAULT_STRESS_SCALE, ...overrides };
}

export function createInMemoryStressFixture(
	overrides: Partial<StressScale> = {}
): InMemoryStressFixture {
	const scale = resolveStressScale(overrides);
	const templates: InMemoryStressTemplate[] = [];

	for (let t = 0; t < scale.templates; t++) {
		const sprints = Array.from({ length: scale.sprintsPerTemplate }, (_, i) => ({
			id: `sprint-${t}-${i}`,
			title: `Sprint ${i + 1}`
		}));
		const epics = Array.from({ length: scale.epicsPerTemplate }, (_, i) => ({
			id: `epic-${t}-${i}`,
			title: `Epic ${i + 1}`
		}));
		const tasks: InMemoryStressTask[] = Array.from(
			{ length: scale.tasksPerTemplate },
			(_, i) => ({
				id: `task-${t}-${i}`,
				status: STATUSES[i % STATUSES.length] ?? 'BACKLOG',
				order: i,
				sprintId: sprints[i % sprints.length]?.id ?? null,
				title: `Task ${i + 1}`
			})
		);

		templates.push({
			id: `template-${t}`,
			title: `${STRESS_TITLE_PREFIX} Template ${t + 1}`,
			tasks,
			sprints,
			epics
		});
	}

	const boardTasks: InMemoryStressTask[] = Array.from(
		{ length: scale.boardTasks },
		(_, i) => ({
			id: `board-task-${i}`,
			status: STATUSES[i % STATUSES.length] ?? 'BACKLOG',
			order: i,
			sprintId: `sprint-board-${i % 4}`,
			title: `Board task ${i + 1}`
		})
	);

	const enrolledProjectIds = Array.from(
		{ length: scale.enrolledProjects },
		(_, i) => `project-${i}`
	);

	const totalTasks = templates.reduce((sum, template) => sum + template.tasks.length, 0);

	return {
		scale,
		templates,
		enrolledProjectIds,
		boardTasks,
		totals: {
			templates: templates.length,
			tasks: totalTasks,
			enrolledProjects: enrolledProjectIds.length,
			boardTasks: boardTasks.length
		}
	};
}

/** Round-trips for the current "my projects" fan-out: 1 list + 2 per project. */
export function countMyProjectsRoundTrips(enrolledProjects: number): number {
	return 1 + enrolledProjects * 2;
}
