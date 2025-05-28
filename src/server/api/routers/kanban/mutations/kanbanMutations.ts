import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const kanbanMutations = {
	moveTask: protectedProcedure
		.input(
			z.object({
				taskId: z.string(),
				fromColumnId: z.string(),
				toColumnId: z.string(),
				toIndex: z.number()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { taskId, fromColumnId, toColumnId, toIndex } = input;

			return await ctx.db.$transaction(async (prisma) => {
				// Get the task being moved
				const task = await prisma.task.findUnique({
					where: { id: taskId },
					include: { kanbanColumn: true }
				});

				if (!task) {
					throw new Error('Task not found');
				}

				// If moving within the same column, just reorder
				if (fromColumnId === toColumnId) {
					// Get all tasks in the column
					const tasksInColumn = await prisma.task.findMany({
						where: { kanbanColumnId: toColumnId },
						orderBy: { orderInColumn: 'asc' }
					});

					// Remove the task from its current position
					const filteredTasks = tasksInColumn.filter((t) => t.id !== taskId);

					// Insert the task at the new position
					filteredTasks.splice(toIndex, 0, task);

					// Update all task positions
					for (let i = 0; i < filteredTasks.length; i++) {
						const taskToUpdate = filteredTasks[i];
						if (taskToUpdate) {
							await prisma.task.update({
								where: { id: taskToUpdate.id },
								data: { orderInColumn: i }
							});
						}
					}
				} else {
					// Moving between different columns

					// Update tasks in the source column (close the gap)
					await prisma.task.updateMany({
						where: {
							kanbanColumnId: fromColumnId,
							orderInColumn: { gt: task.orderInColumn ?? 0 }
						},
						data: {
							orderInColumn: { decrement: 1 }
						}
					});

					// Update tasks in the destination column (make space)
					await prisma.task.updateMany({
						where: {
							kanbanColumnId: toColumnId,
							orderInColumn: { gte: toIndex }
						},
						data: {
							orderInColumn: { increment: 1 }
						}
					});

					// Move the task to the new column and position
					await prisma.task.update({
						where: { id: taskId },
						data: {
							kanbanColumnId: toColumnId,
							orderInColumn: toIndex
						}
					});
				}

				return { success: true };
			});
		}),

	updateTaskPosition: protectedProcedure
		.input(
			z.object({
				taskId: z.string(),
				columnId: z.string(),
				newIndex: z.number()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { taskId, columnId, newIndex } = input;

			return await ctx.db.$transaction(async (prisma) => {
				// Get current task
				const currentTask = await prisma.task.findUnique({
					where: { id: taskId }
				});

				if (!currentTask) {
					throw new Error('Task not found');
				}

				const currentIndex = currentTask.orderInColumn ?? 0;

				if (currentIndex === newIndex) {
					return { success: true }; // No change needed
				}

				// Get all tasks in the column
				const tasksInColumn = await prisma.task.findMany({
					where: { kanbanColumnId: columnId },
					orderBy: { orderInColumn: 'asc' }
				});

				// Remove the task from its current position
				const filteredTasks = tasksInColumn.filter((t) => t.id !== taskId);

				// Insert the task at the new position
				filteredTasks.splice(newIndex, 0, currentTask);

				// Update all task positions
				for (let i = 0; i < filteredTasks.length; i++) {
					const taskToUpdate = filteredTasks[i];
					if (taskToUpdate) {
						await prisma.task.update({
							where: { id: taskToUpdate.id },
							data: { orderInColumn: i }
						});
					}
				}

				return { success: true };
			});
		})
};
