import { Prisma } from '@prisma/client';

export const KANBAN_RANK_STEP = 1_000_000n;
const KANBAN_RANK_MIN = -(1n << 62n);
const KANBAN_RANK_MAX = 1n << 62n;

export function calculateKanbanRank(
	previousRank: bigint | null,
	nextRank: bigint | null
): bigint | null {
	if (previousRank === null) {
		if (nextRank === null) return KANBAN_RANK_STEP;
		const candidate = nextRank - KANBAN_RANK_STEP;
		return candidate >= KANBAN_RANK_MIN ? candidate : null;
	}
	if (nextRank === null) {
		const candidate = previousRank + KANBAN_RANK_STEP;
		return candidate <= KANBAN_RANK_MAX ? candidate : null;
	}
	if (nextRank - previousRank <= 1n) return null;
	return previousRank + (nextRank - previousRank) / 2n;
}

export function buildKanbanRankRebalanceSql(
	projectId: string,
	targetStatus: string
): Prisma.Sql {
	return Prisma.sql`
		WITH ranked AS (
			SELECT
				"id",
				((ROW_NUMBER() OVER (
					ORDER BY "kanbanRank" ASC NULLS LAST, "order" ASC NULLS LAST,
					"createdAt" ASC, "id" ASC
				)) * 1000000)::INT8 AS "newRank"
			FROM "public"."Task"
			WHERE "projectId" = ${projectId}
				AND "status" = ${targetStatus}::"public"."TaskStatusEnum"
		)
		UPDATE "public"."Task" AS task
		SET "kanbanRank" = ranked."newRank",
			"updatedAt" = NOW()
		FROM ranked
		WHERE task."id" = ranked."id"
	`;
}

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
	const rows = updates.map(
		(update) =>
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
