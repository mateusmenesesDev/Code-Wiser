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
	const statuses: string[] = [];
	const rememberStatus = (status: string | null) => {
		if (status && !statuses.includes(status)) statuses.push(status);
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
