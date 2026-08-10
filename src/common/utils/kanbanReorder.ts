export type KanbanReorderItem = {
	id: string;
	status: string | null;
};

export type KanbanOrderedItem = KanbanReorderItem & {
	order?: number | null;
};

export type TaskOrderUpdate = {
	id: string;
	order: number;
	status: string;
};

export type KanbanInsertPosition = 'before' | 'after';

export const reorderKanbanItems = <T extends KanbanReorderItem>(
	data: T[],
	activeId: string,
	overId: string | null | undefined,
	columnIds: readonly string[],
	insertPosition: KanbanInsertPosition = 'after'
): T[] => {
	if (!overId || activeId === overId) return data;

	const activeItem = data.find((item) => item.id === activeId);
	if (!activeItem?.status) return data;

	const columnIdSet = new Set(columnIds);
	const overIsColumn = columnIdSet.has(overId);
	const overItem = data.find((item) => item.id === overId);
	const targetStatus = overIsColumn ? overId : overItem?.status;
	if (!targetStatus) return data;

	const movedItem = { ...activeItem, status: targetStatus } as T;
	const withoutActive = data.filter((item) => item.id !== activeId);

	if (overIsColumn) {
		let insertIndex = withoutActive.length;
		for (let i = withoutActive.length - 1; i >= 0; i--) {
			if (withoutActive[i]?.status === targetStatus) {
				insertIndex = i + 1;
				break;
			}
		}

		return [
			...withoutActive.slice(0, insertIndex),
			movedItem,
			...withoutActive.slice(insertIndex)
		];
	}

	const overIndexAfterRemoval = withoutActive.findIndex(
		(item) => item.id === overId
	);
	if (overIndexAfterRemoval === -1) return data;

	const activeIndex = data.findIndex((item) => item.id === activeId);
	const overIndex = data.findIndex((item) => item.id === overId);
	const resolvedInsertPosition =
		overItem?.status === activeItem.status &&
		activeIndex !== -1 &&
		overIndex !== -1
			? activeIndex < overIndex
				? 'after'
				: 'before'
			: insertPosition;
	const insertIndex =
		resolvedInsertPosition === 'after'
			? overIndexAfterRemoval + 1
			: overIndexAfterRemoval;

	return [
		...withoutActive.slice(0, insertIndex),
		movedItem,
		...withoutActive.slice(insertIndex)
	];
};

export const mergeVisibleKanbanItems = <T extends KanbanReorderItem>(
	allData: T[],
	visibleData: T[]
): T[] => {
	if (allData.length === visibleData.length) return visibleData;

	const visibleIds = new Set(visibleData.map((task) => task.id));
	const seenStatuses = new Set<string>();
	const statuses: string[] = [];
	const rememberStatus = (status: string | null) => {
		if (status && !seenStatuses.has(status)) {
			seenStatuses.add(status);
			statuses.push(status);
		}
	};

	for (const task of allData) rememberStatus(task.status);
	for (const task of visibleData) rememberStatus(task.status);

	const visibleRankByStatus = new Map<string, number>();
	const hiddenBucketsByStatus = new Map<string, Map<number, T[]>>();

	for (const task of allData) {
		if (!task.status) continue;

		const visibleRank = visibleRankByStatus.get(task.status) ?? 0;
		if (visibleIds.has(task.id)) {
			visibleRankByStatus.set(task.status, visibleRank + 1);
			continue;
		}

		const buckets =
			hiddenBucketsByStatus.get(task.status) ?? new Map<number, T[]>();
		const bucket = buckets.get(visibleRank) ?? [];
		bucket.push(task);
		buckets.set(visibleRank, bucket);
		hiddenBucketsByStatus.set(task.status, buckets);
	}

	const visibleByStatus = new Map<string, T[]>();
	for (const task of visibleData) {
		if (!task.status) continue;
		const tasks = visibleByStatus.get(task.status) ?? [];
		tasks.push(task);
		visibleByStatus.set(task.status, tasks);
	}

	return statuses.flatMap((status) => {
		const visibleTasks = visibleByStatus.get(status) ?? [];
		const hiddenBuckets =
			hiddenBucketsByStatus.get(status) ?? new Map<number, T[]>();
		const lastHiddenBucket = Math.max(-1, ...hiddenBuckets.keys());
		const lastRank = Math.max(visibleTasks.length, lastHiddenBucket);
		const tasks: T[] = [];

		for (let rank = 0; rank <= lastRank; rank++) {
			tasks.push(...(hiddenBuckets.get(rank) ?? []));
			const visibleTask = visibleTasks[rank];
			if (visibleTask) tasks.push(visibleTask);
		}

		return tasks;
	});
};

export const toPerColumnOrderUpdates = <T extends KanbanReorderItem>(
	data: T[]
): TaskOrderUpdate[] => {
	const nextOrderByStatus = new Map<string, number>();

	return data.flatMap((task) => {
		if (!task.status) return [];

		const order = nextOrderByStatus.get(task.status) ?? 0;
		nextOrderByStatus.set(task.status, order + 1);

		return [{ id: task.id, order, status: task.status }];
	});
};

export const toKanbanOrderUpdates = <T extends KanbanOrderedItem>(
	allData: T[],
	visibleData: T[] = allData
): TaskOrderUpdate[] => {
	const data = mergeVisibleKanbanItems(allData, visibleData);
	const previousById = new Map(allData.map((task) => [task.id, task]));

	return toPerColumnOrderUpdates(data).filter((update) => {
		const previous = previousById.get(update.id);
		return (
			previous?.order !== update.order || previous?.status !== update.status
		);
	});
};

export type TaskOrderPatch = {
	id: string;
	order: number;
	status?: string;
};

export const applyTaskOrderUpdates = <
	T extends { id: string; order?: number | null; status?: unknown }
>(
	tasks: T[],
	updates: TaskOrderPatch[],
	options?: { sort?: boolean }
): T[] => {
	const updatesById = new Map(updates.map((update) => [update.id, update]));
	const next = tasks.map((task) => {
		const update = updatesById.get(task.id);
		if (!update) return task;

		if (update.status !== undefined) {
			return {
				...task,
				order: update.order,
				status: update.status as T['status']
			};
		}

		return {
			...task,
			order: update.order
		};
	});

	if (options?.sort === false) return next;

	return next.sort((a, b) => {
		const statusOrder = String(a.status ?? '').localeCompare(
			String(b.status ?? '')
		);
		if (statusOrder !== 0) return statusOrder;
		return (a.order ?? 0) - (b.order ?? 0);
	});
};

export const removeTasksByIds = <T extends { id: string }>(
	tasks: T[],
	ids: Iterable<string>
): T[] => {
	const idSet = ids instanceof Set ? ids : new Set(ids);
	if (idSet.size === 0) return tasks;
	return tasks.filter((task) => !idSet.has(task.id));
};

export const bucketTasksByStatus = <T extends { status: string | null }>(
	tasks: T[]
): Map<string, T[]> => {
	const buckets = new Map<string, T[]>();
	for (const task of tasks) {
		if (!task.status) continue;
		const bucket = buckets.get(task.status) ?? [];
		bucket.push(task);
		buckets.set(task.status, bucket);
	}
	return buckets;
};

export const groupTasksBySprintId = <
	T extends { sprintId: string | null }
>(
	tasks: T[]
): Map<string | null, T[]> => {
	const groups = new Map<string | null, T[]>();
	for (const task of tasks) {
		const bucket = groups.get(task.sprintId) ?? [];
		bucket.push(task);
		groups.set(task.sprintId, bucket);
	}
	return groups;
};

export const idsByStatusFromBuckets = <T extends { id: string }>(
	buckets: Map<string, T[]>
): Map<string, Set<string>> => {
	const idsByStatus = new Map<string, Set<string>>();
	for (const [status, statusTasks] of buckets) {
		idsByStatus.set(status, new Set(statusTasks.map((task) => task.id)));
	}
	return idsByStatus;
};
