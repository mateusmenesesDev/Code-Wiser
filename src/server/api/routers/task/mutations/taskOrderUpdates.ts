import { Prisma } from '@prisma/client';

export type TaskOrderUpdateInput = {
	id: string;
	order: number;
	status?: string;
};

export type TaskOrderCurrentRow = {
	id: string;
	order: number | null;
	status: string | null;
	projectId: string | null;
};

export function selectChangedTaskOrderUpdates(
	updates: TaskOrderUpdateInput[],
	currentById: Map<string, TaskOrderCurrentRow>
): TaskOrderUpdateInput[] {
	const changed: TaskOrderUpdateInput[] = [];

	for (const update of updates) {
		const current = currentById.get(update.id);
		if (!current) {
			throw new Error(`Task not found: ${update.id}`);
		}

		const orderChanged = update.order !== current.order;
		const statusChanged =
			update.status !== undefined && update.status !== current.status;

		if (orderChanged || statusChanged) {
			changed.push(update);
		}
	}

	return changed;
}

export function buildBulkTaskOrderUpdateSql(
	updates: TaskOrderUpdateInput[]
): Prisma.Sql {
	const rows = updates.map((update) =>
		Prisma.sql`(${update.id}, ${update.order}, ${update.status ?? null})`
	);

	return Prisma.sql`
		UPDATE "Task" AS t
		SET
			"order" = v.ord,
			"status" = CASE
				WHEN v.new_status IS NULL THEN t."status"
				ELSE v.new_status::"TaskStatusEnum"
			END,
			"updatedAt" = NOW()
		FROM (VALUES ${Prisma.join(rows)}) AS v(id, ord, new_status)
		WHERE t.id = v.id
	`;
}
