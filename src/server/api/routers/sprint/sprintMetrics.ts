import { TaskStatusEnum, type Prisma } from '@prisma/client';

const toUtcDay = (date: Date) =>
	new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);

type SprintMetricsDb = Prisma.TransactionClient;

export async function captureSprintSnapshot(
	db: SprintMetricsDb,
	sprintId: string,
	at = new Date()
) {
	const sprint = await db.sprint.findUnique({
		where: { id: sprintId },
		select: { committedPoints: true }
	});

	if (!sprint) return null;

	const tasks = await db.task.findMany({
		where: { sprintId },
		select: { status: true, storyPoints: true }
	});
	const completedTasks = tasks.filter(
		(task) => task.status === TaskStatusEnum.DONE
	);
	const currentPoints = tasks.reduce(
		(total, task) => total + (task.storyPoints ?? 0),
		0
	);
	const completedPoints = completedTasks.reduce(
		(total, task) => total + (task.storyPoints ?? 0),
		0
	);
	const remainingPoints = tasks.reduce(
		(total, task) =>
			task.status === TaskStatusEnum.DONE
				? total
				: total + (task.storyPoints ?? 0),
		0
	);

	return db.sprintDailySnapshot.upsert({
		where: {
			sprintId_day: { sprintId, day: toUtcDay(at) }
		},
		create: {
			sprintId,
			day: toUtcDay(at),
			committedPoints: sprint.committedPoints,
			currentPoints,
			completedPoints,
			remainingPoints,
			taskCount: tasks.length,
			completedTaskCount: completedTasks.length,
			unestimatedTaskCount: tasks.filter((task) => task.storyPoints === null)
				.length
		},
		update: {
			committedPoints: sprint.committedPoints,
			currentPoints,
			completedPoints,
			remainingPoints,
			taskCount: tasks.length,
			completedTaskCount: completedTasks.length,
			unestimatedTaskCount: tasks.filter((task) => task.storyPoints === null)
				.length
		}
	});
}
