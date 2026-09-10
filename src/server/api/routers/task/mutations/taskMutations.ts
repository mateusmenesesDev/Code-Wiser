import {
	Prisma,
	SprintChangeTypeEnum,
	SprintStatusEnum,
	TaskStatusEnum,
	TaskTypeEnum
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import { protectedProcedure } from '~/server/api/trpc';
import {
	notifyTaskAssigned,
	notifyTaskBlocked,
	notifyTaskStatusChanged
} from '~/server/services/notification/notificationService';
import {
	type ResourceAccessContext,
	assertProjectIsActive,
	assertProjectResourceAccess,
	userHasAccessToProject,
	userHasAccessToProjectTemplate
} from '~/server/utils/auth';
import { captureSprintSnapshot } from '../../sprint/sprintMetrics';
import { deleteUploadThingFiles } from '../attachments/taskAttachment.utils';
import {
	KANBAN_RANK_STEP,
	buildBulkTaskOrderUpdateSql,
	buildKanbanRankRebalanceSql,
	calculateKanbanRank,
	selectChangedTaskOrderUpdates
} from './taskOrderUpdates';

type RelationshipUpdate = { connect: { id: string } } | { disconnect: true };

const MAX_TRANSACTION_RETRIES = 3;
const MAX_TASK_ORDER_UPDATES = 500;

const createRelationshipUpdate = (
	id: string | null | undefined
): RelationshipUpdate | undefined => {
	if (id === undefined) return undefined;
	return id ? { connect: { id } } : { disconnect: true };
};

const assertTaskRelationsBelongToResource = async (
	ctx: ResourceAccessContext,
	projectId: string,
	isTemplate: boolean,
	epicId: string | null | undefined,
	sprintId: string | null | undefined,
	productVersionId: string | null | undefined,
	taskType: TaskTypeEnum | null | undefined
) => {
	if (epicId) {
		const epic = await ctx.db.epic.findFirst({
			where: isTemplate
				? { id: epicId, projectTemplateId: projectId }
				: { id: epicId, projectId },
			select: { id: true }
		});
		if (!epic) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Epic does not belong to this project'
			});
		}
	}

	if (sprintId) {
		const sprint = await ctx.db.sprint.findFirst({
			where: isTemplate
				? { id: sprintId, projectTemplateId: projectId }
				: { id: sprintId, projectId },
			select: { id: true }
		});
		if (!sprint) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Sprint does not belong to this project'
			});
		}
	}

	if (productVersionId) {
		if (taskType !== TaskTypeEnum.USER_STORY) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Only User Stories can belong to a product version'
			});
		}

		const version = await ctx.db.productVersion.findFirst({
			where: isTemplate
				? { id: productVersionId, projectTemplateId: projectId }
				: { id: productVersionId, projectId },
			select: { id: true }
		});
		if (!version) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Product version does not belong to this project'
			});
		}
	}
};

export const taskMutations = {
	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ input, ctx }) => {
			const {
				isTemplate,
				projectId,
				epicId,
				sprintId,
				assigneeIds,
				type,
				productVersionId,
				...rest
			} = input;

			if (isTemplate) {
				await userHasAccessToProjectTemplate(ctx, projectId);
			} else {
				await userHasAccessToProject(ctx, projectId);
			}

			await assertTaskRelationsBelongToResource(
				ctx,
				projectId,
				isTemplate,
				epicId,
				sprintId,
				productVersionId,
				type ?? TaskTypeEnum.USER_STORY
			);

			if (sprintId) {
				const sprint = await ctx.db.sprint.findUnique({
					where: { id: sprintId },
					select: { status: true }
				});
				if (sprint?.status === SprintStatusEnum.COMPLETED) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Completed sprints cannot receive new tasks'
					});
				}
			}

			if (!isTemplate && assigneeIds?.length) {
				const members = await ctx.db.user.findMany({
					where: {
						id: { in: assigneeIds },
						projectMemberships: {
							some: { projectId, status: 'ACTIVE' }
						}
					},
					select: { id: true }
				});
				if (members.length !== new Set(assigneeIds).size) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Tasks can only be assigned to project members'
					});
				}
			}

			if (!isTemplate) {
				await assertProjectIsActive(ctx.db, projectId);
			}

			for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
				try {
					const task = await ctx.db.$transaction(async (prisma) => {
						const counter = isTemplate
							? await prisma.projectTemplate.update({
									where: { id: projectId },
									data: { nextTaskNumber: { increment: 1 } },
									select: { nextTaskNumber: true }
								})
							: await prisma.project.update({
									where: { id: projectId },
									data: { nextTaskNumber: { increment: 1 } },
									select: { nextTaskNumber: true }
								});

						const taskStatus = rest.status ?? TaskStatusEnum.BACKLOG;
						const lastKanbanTask = await prisma.task.findFirst({
							where: isTemplate
								? { projectTemplateId: projectId, status: taskStatus }
								: { projectId, status: taskStatus },
							orderBy: { kanbanRank: 'desc' },
							select: { kanbanRank: true }
						});

						const task = await prisma.task.create({
							data: {
								...rest,
								kanbanRank:
									(lastKanbanTask?.kanbanRank ?? 0n) + KANBAN_RANK_STEP,
								publicNumber: counter.nextTaskNumber - 1,
								...(isTemplate
									? { projectTemplate: { connect: { id: projectId } } }
									: { project: { connect: { id: projectId } } }),
								assignees: assigneeIds?.length
									? { connect: assigneeIds.map((id) => ({ id })) }
									: undefined,
								epic: epicId ? { connect: { id: epicId } } : undefined,
								sprint: sprintId ? { connect: { id: sprintId } } : undefined,
								productVersion: productVersionId
									? { connect: { id: productVersionId } }
									: undefined
							}
						});

						if (sprintId) {
							const sprint = await prisma.sprint.findUnique({
								where: { id: sprintId },
								select: { status: true }
							});
							if (sprint?.status === SprintStatusEnum.ACTIVE) {
								await prisma.sprintChange.create({
									data: {
										sprintId,
										taskId: task.id,
										authorId: ctx.session.userId,
										type: SprintChangeTypeEnum.TASK_ADDED,
										previousStoryPoints: null,
										newStoryPoints: task.storyPoints
									}
								});
								await captureSprintSnapshot(prisma, sprintId);
							}
						}

						return task;
					});
					return task;
				} catch (error) {
					if (
						error instanceof Prisma.PrismaClientKnownRequestError &&
						error.code === 'P2034' &&
						attempt < MAX_TRANSACTION_RETRIES
					) {
						continue;
					}
					if (
						error instanceof Prisma.PrismaClientKnownRequestError &&
						error.code === 'P2002'
					) {
						throw new TRPCError({
							code: 'CONFLICT',
							message: `A task with the title "${rest.title}" already exists in this project`
						});
					}
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Something went wrong while creating the task'
					});
				}
			}

			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Something went wrong while creating the task'
			});
		}),

	update: protectedProcedure
		.input(updateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				id,
				epicId,
				sprintId,
				assigneeIds,
				projectId,
				isTemplate,
				productVersionId,
				type,
				...rest
			} = input;

			// Verify access through existing task
			const existingTask = await ctx.db.task.findUnique({
				where: { id },
				select: {
					id: true,
					projectId: true,
					projectTemplateId: true,
					status: true,
					blocked: true,
					storyPoints: true,
					sprintId: true,
					type: true,
					productVersionId: true,
					title: true,
					sprint: {
						select: { id: true, status: true }
					},
					project: {
						select: {
							id: true,
							title: true,
							memberships: {
								where: { status: 'ACTIVE' },
								select: { userId: true }
							}
						}
					},
					assignees: {
						select: {
							id: true,
							name: true
						}
					}
				}
			});

			if (!existingTask) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task not found'
				});
			}

			await assertProjectResourceAccess(ctx, existingTask);
			if (Boolean(existingTask.projectTemplateId) !== isTemplate) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Task resource type does not match the request'
				});
			}
			if (
				projectId &&
				(existingTask.projectId ?? existingTask.projectTemplateId) !== projectId
			) {
				if (isTemplate) {
					await userHasAccessToProjectTemplate(ctx, projectId);
				} else {
					await userHasAccessToProject(ctx, projectId);
					await assertProjectIsActive(ctx.db, projectId);
				}
			}
			if (existingTask.projectId && !isTemplate) {
				await assertProjectIsActive(ctx.db, existingTask.projectId);
			}

			const resourceId =
				projectId ?? existingTask.projectId ?? existingTask.projectTemplateId;
			if (!resourceId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Task is not attached to a project resource'
				});
			}

			await assertTaskRelationsBelongToResource(
				ctx,
				resourceId,
				isTemplate,
				epicId,
				sprintId,
				productVersionId === undefined
					? existingTask.productVersionId
					: productVersionId,
				type ?? existingTask.type
			);

			const targetSprint = sprintId
				? await ctx.db.sprint.findUnique({
						where: { id: sprintId },
						select: { id: true, status: true }
					})
				: null;
			if (targetSprint?.status === SprintStatusEnum.COMPLETED) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Completed sprints cannot receive new task changes'
				});
			}
			if (
				existingTask.sprint?.status === SprintStatusEnum.COMPLETED &&
				(sprintId !== undefined ||
					rest.storyPoints !== undefined ||
					rest.status !== undefined)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message:
						'Tasks in completed sprints are immutable for planning metrics'
				});
			}

			if (assigneeIds && existingTask.project) {
				const memberIds = new Set(
					existingTask.project.memberships.map(
						(membership) => membership.userId
					)
				);
				if (assigneeIds.some((assigneeId) => !memberIds.has(assigneeId))) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Tasks can only be assigned to project members'
					});
				}
			}

			const oldAssigneeIds = existingTask.assignees.map((a) => a.id);
			const oldStatus = existingTask.status;
			const oldBlocked = existingTask.blocked;
			const isMovingIntoProgress =
				Boolean(existingTask.projectId) &&
				rest.status === TaskStatusEnum.IN_PROGRESS &&
				existingTask.status !== TaskStatusEnum.IN_PROGRESS;
			const assigneeIdsToSet = isMovingIntoProgress
				? [...new Set([...(assigneeIds ?? oldAssigneeIds), ctx.session.userId])]
				: assigneeIds;

			const updateData = {
				...rest,
				...(type !== undefined && { type }),
				...(createRelationshipUpdate(productVersionId) && {
					productVersion: createRelationshipUpdate(productVersionId)
				}),
				...(assigneeIdsToSet !== undefined && {
					assignees: {
						set: assigneeIdsToSet.map((assigneeId) => ({ id: assigneeId }))
					}
				}),
				...(createRelationshipUpdate(epicId) && {
					epic: createRelationshipUpdate(epicId)
				}),
				...(createRelationshipUpdate(sprintId) && {
					sprint: createRelationshipUpdate(sprintId)
				})
			};

			const task = await ctx.db.$transaction(async (tx) => {
				let kanbanRank: bigint | undefined;
				if (rest.status !== undefined && rest.status !== existingTask.status) {
					if (existingTask.projectId) {
						await tx.$queryRaw(
							Prisma.sql`SELECT "id" FROM "public"."Project" WHERE "id" = ${existingTask.projectId} FOR UPDATE`
						);
					} else if (existingTask.projectTemplateId) {
						await tx.$queryRaw(
							Prisma.sql`SELECT "id" FROM "public"."ProjectTemplate" WHERE "id" = ${existingTask.projectTemplateId} FOR UPDATE`
						);
					}

					const lastKanbanTask = await tx.task.findFirst({
						where: existingTask.projectId
							? {
									projectId: existingTask.projectId,
									status: rest.status
								}
							: {
									projectTemplateId:
										existingTask.projectTemplateId ?? undefined,
									status: rest.status
								},
						orderBy: { kanbanRank: 'desc' },
						select: { kanbanRank: true }
					});
					kanbanRank = (lastKanbanTask?.kanbanRank ?? 0n) + KANBAN_RANK_STEP;
				}

				const updatedTask = await tx.task.update({
					where: { id },
					data: {
						...updateData,
						...(kanbanRank !== undefined && { kanbanRank }),
						...(projectId
							? isTemplate
								? { projectTemplate: { connect: { id: projectId } } }
								: { project: { connect: { id: projectId } } }
							: {})
					},
					include: {
						assignees: {
							select: {
								id: true,
								name: true
							}
						},
						project: {
							select: {
								id: true,
								title: true
							}
						}
					}
				});

				const nextSprintId =
					sprintId === undefined ? existingTask.sprintId : sprintId;
				const changedSprintIds = new Set<string>();
				if (
					existingTask.sprintId &&
					existingTask.sprintId !== nextSprintId &&
					existingTask.sprint?.status === SprintStatusEnum.ACTIVE
				) {
					await tx.sprintChange.create({
						data: {
							sprintId: existingTask.sprintId,
							taskId: updatedTask.id,
							authorId: ctx.session.userId,
							type: SprintChangeTypeEnum.TASK_REMOVED,
							previousStoryPoints: existingTask.storyPoints,
							newStoryPoints: null
						}
					});
					changedSprintIds.add(existingTask.sprintId);
				}
				if (
					nextSprintId &&
					nextSprintId !== existingTask.sprintId &&
					targetSprint?.status === SprintStatusEnum.ACTIVE
				) {
					await tx.sprintChange.create({
						data: {
							sprintId: nextSprintId,
							taskId: updatedTask.id,
							authorId: ctx.session.userId,
							type: SprintChangeTypeEnum.TASK_ADDED,
							previousStoryPoints: null,
							newStoryPoints: updatedTask.storyPoints
						}
					});
					changedSprintIds.add(nextSprintId);
				}
				if (
					nextSprintId &&
					nextSprintId === existingTask.sprintId &&
					existingTask.sprint?.status === SprintStatusEnum.ACTIVE &&
					rest.storyPoints !== undefined &&
					rest.storyPoints !== existingTask.storyPoints
				) {
					await tx.sprintChange.create({
						data: {
							sprintId: nextSprintId,
							taskId: updatedTask.id,
							authorId: ctx.session.userId,
							type: SprintChangeTypeEnum.ESTIMATE_CHANGED,
							previousStoryPoints: existingTask.storyPoints,
							newStoryPoints: updatedTask.storyPoints
						}
					});
					changedSprintIds.add(nextSprintId);
				}
				if (
					nextSprintId &&
					nextSprintId === existingTask.sprintId &&
					existingTask.sprint?.status === SprintStatusEnum.ACTIVE &&
					rest.status !== undefined &&
					rest.status !== existingTask.status
				) {
					changedSprintIds.add(nextSprintId);
				}

				for (const changedSprintId of changedSprintIds) {
					await captureSprintSnapshot(tx, changedSprintId);
				}
				return updatedTask;
			});

			if (existingTask.projectId && existingTask.project) {
				const changedByUser = await ctx.db.user.findUnique({
					where: { id: ctx.session.userId as string },
					select: { name: true }
				});

				const notificationPromises: Promise<void>[] = [];
				const currentAssigneeIds = task.assignees.map((a) => a.id);

				if (assigneeIdsToSet !== undefined) {
					const newlyAssignedIds = assigneeIdsToSet.filter(
						(assigneeId) => !oldAssigneeIds.includes(assigneeId)
					);
					for (const newlyAssignedId of newlyAssignedIds) {
						notificationPromises.push(
							notifyTaskAssigned({
								db: ctx.db,
								taskId: task.id,
								taskTitle: task.title,
								assigneeId: newlyAssignedId,
								projectId: existingTask.projectId,
								projectName: existingTask.project.title
							}).catch((error) => {
								console.error(
									'Failed to send task assigned notification:',
									error
								);
							})
						);
					}
				}

				// Notify if status changed
				if (rest.status && rest.status !== oldStatus) {
					notificationPromises.push(
						notifyTaskStatusChanged({
							db: ctx.db,
							taskId: task.id,
							taskTitle: task.title,
							oldStatus: oldStatus ?? '',
							newStatus: rest.status,
							assigneeIds: currentAssigneeIds,
							projectId: existingTask.projectId,
							projectName: existingTask.project.title,
							changedByUserId: ctx.session.userId as string,
							changedByName: changedByUser?.name ?? null
						}).catch((error) => {
							console.error(
								'Failed to send task status changed notification:',
								error
							);
						})
					);
				}

				// Notify if blocked status changed
				if (rest.blocked !== undefined && rest.blocked !== oldBlocked) {
					notificationPromises.push(
						notifyTaskBlocked({
							db: ctx.db,
							taskId: task.id,
							taskTitle: task.title,
							isBlocked: rest.blocked,
							assigneeIds: currentAssigneeIds,
							projectId: existingTask.projectId,
							projectName: existingTask.project.title,
							changedByUserId: ctx.session.userId as string,
							changedByName: changedByUser?.name ?? null
						}).catch((error) => {
							console.error('Failed to send task blocked notification:', error);
						})
					);
				}

				await Promise.all(notificationPromises);
			}

			return task;
		}),

	moveTask: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				taskId: z.string(),
				targetStatus: z.nativeEnum(TaskStatusEnum),
				beforeTaskId: z.string().nullable().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const task = await ctx.db.task.findUnique({
				where: { id: input.taskId },
				select: {
					id: true,
					projectId: true,
					projectTemplateId: true,
					status: true,
					kanbanRank: true,
					sprint: { select: { id: true, status: true } }
				}
			});

			if (!task) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task not found'
				});
			}
			if (task.projectTemplateId || task.projectId !== input.projectId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Task does not belong to this project'
				});
			}

			await userHasAccessToProject(ctx, input.projectId);
			await assertProjectIsActive(ctx.db, input.projectId);
			if (
				task.sprint?.status === SprintStatusEnum.COMPLETED &&
				task.status !== input.targetStatus
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Tasks in completed sprints cannot change status'
				});
			}

			const beforeTaskId = input.beforeTaskId ?? null;
			if (beforeTaskId === input.taskId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'A task cannot be placed before itself'
				});
			}

			for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
				try {
					return await ctx.db.$transaction(async (tx) => {
						await tx.$queryRaw(
							Prisma.sql`SELECT "id" FROM "public"."Project" WHERE "id" = ${input.projectId} FOR UPDATE`
						);

						let currentTask = await tx.task.findUnique({
							where: { id: input.taskId },
							select: {
								id: true,
								projectId: true,
								status: true,
								kanbanRank: true,
								sprint: { select: { id: true, status: true } }
							}
						});
						if (!currentTask || currentTask.projectId !== input.projectId) {
							throw new TRPCError({
								code: 'NOT_FOUND',
								message: 'Task not found in this project'
							});
						}
						if (
							currentTask.sprint?.status === SprintStatusEnum.COMPLETED &&
							currentTask.status !== input.targetStatus
						) {
							throw new TRPCError({
								code: 'BAD_REQUEST',
								message: 'Tasks in completed sprints cannot change status'
							});
						}

						if (
							currentTask.kanbanRank === null &&
							currentTask.status === input.targetStatus
						) {
							await tx.$executeRaw(
								buildKanbanRankRebalanceSql(input.projectId, input.targetStatus)
							);
							const refreshedTask = await tx.task.findUnique({
								where: { id: input.taskId },
								select: {
									id: true,
									projectId: true,
									status: true,
									kanbanRank: true,
									sprint: { select: { id: true, status: true } }
								}
							});
							if (!refreshedTask) {
								throw new TRPCError({
									code: 'NOT_FOUND',
									message: 'Task not found in this project'
								});
							}
							currentTask = refreshedTask;
						}

						const targetWhere = {
							projectId: input.projectId,
							status: input.targetStatus,
							id: { not: input.taskId }
						};
						const findNeighbors = async () => {
							const successor = beforeTaskId
								? await tx.task.findUnique({
										where: { id: beforeTaskId },
										select: {
											id: true,
											projectId: true,
											status: true,
											kanbanRank: true
										}
									})
								: null;
							if (
								successor &&
								(successor.projectId !== input.projectId ||
									successor.status !== input.targetStatus)
							) {
								throw new TRPCError({
									code: 'CONFLICT',
									message: 'The task order changed; please retry'
								});
							}
							if (beforeTaskId && !successor) {
								throw new TRPCError({
									code: 'CONFLICT',
									message: 'The task order changed; please retry'
								});
							}

							const predecessor = await tx.task.findFirst({
								where:
									successor?.kanbanRank !== null &&
									successor?.kanbanRank !== undefined
										? {
												...targetWhere,
												kanbanRank: { lt: successor.kanbanRank }
											}
										: targetWhere,
								orderBy: { kanbanRank: 'desc' },
								select: { kanbanRank: true }
							});
							return { successor, predecessor };
						};

						if (
							currentTask.status === input.targetStatus &&
							currentTask.kanbanRank !== null
						) {
							const currentSuccessor = await tx.task.findFirst({
								where: {
									...targetWhere,
									kanbanRank: { gt: currentTask.kanbanRank }
								},
								orderBy: { kanbanRank: 'asc' },
								select: { id: true }
							});
							if (
								currentSuccessor?.id === beforeTaskId ||
								(!currentSuccessor && !beforeTaskId)
							) {
								return { success: true, updatedCount: 0 };
							}
						}

						let neighbors = await findNeighbors();
						if (
							neighbors.successor?.kanbanRank === null ||
							neighbors.predecessor?.kanbanRank === null
						) {
							await tx.$executeRaw(
								buildKanbanRankRebalanceSql(input.projectId, input.targetStatus)
							);
							neighbors = await findNeighbors();
						}

						let newRank = calculateKanbanRank(
							neighbors.predecessor?.kanbanRank ?? null,
							neighbors.successor?.kanbanRank ?? null
						);
						if (newRank === null) {
							await tx.$executeRaw(
								buildKanbanRankRebalanceSql(input.projectId, input.targetStatus)
							);
							neighbors = await findNeighbors();
							newRank = calculateKanbanRank(
								neighbors.predecessor?.kanbanRank ?? null,
								neighbors.successor?.kanbanRank ?? null
							);
						}
						if (newRank === null) {
							throw new TRPCError({
								code: 'INTERNAL_SERVER_ERROR',
								message: 'Could not allocate a task position'
							});
						}

						await tx.task.update({
							where: { id: input.taskId },
							data: {
								status: input.targetStatus,
								kanbanRank: newRank,
								...(currentTask.status !== TaskStatusEnum.IN_PROGRESS &&
									input.targetStatus === TaskStatusEnum.IN_PROGRESS && {
										assignees: {
											connect: { id: ctx.session.userId }
										}
									})
							}
						});

						if (
							currentTask.sprint?.status === SprintStatusEnum.ACTIVE &&
							currentTask.sprint.id &&
							currentTask.status !== input.targetStatus
						) {
							await captureSprintSnapshot(tx, currentTask.sprint.id);
						}

						return { success: true, updatedCount: 1 };
					});
				} catch (error) {
					if (
						error instanceof Prisma.PrismaClientKnownRequestError &&
						error.code === 'P2034' &&
						attempt < MAX_TRANSACTION_RETRIES
					) {
						continue;
					}
					throw error;
				}
			}

			throw new TRPCError({
				code: 'CONFLICT',
				message: 'The task order changed; please retry'
			});
		}),

	updateTaskOrders: protectedProcedure
		.input(
			z.object({
				updates: z
					.array(
						z.object({
							id: z.string(),
							order: z.number(),
							status: z.string().optional()
						})
					)
					.max(MAX_TASK_ORDER_UPDATES)
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (input.updates.length === 0) {
				return { success: true, updatedCount: 0 };
			}

			const updateIds = [...new Set(input.updates.map((update) => update.id))];
			const tasks = await ctx.db.task.findMany({
				where: { id: { in: updateIds } },
				select: {
					id: true,
					order: true,
					status: true,
					projectId: true,
					projectTemplateId: true,
					sprint: { select: { id: true, status: true } }
				}
			});

			if (tasks.length !== updateIds.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'One or more tasks were not found'
				});
			}

			for (const task of tasks) {
				await assertProjectResourceAccess(ctx, task);
				if (task.projectId) {
					await assertProjectIsActive(ctx.db, task.projectId);
				}
				const requestedUpdate = input.updates.find(
					(update) => update.id === task.id
				);
				if (
					task.sprint?.status === SprintStatusEnum.COMPLETED &&
					requestedUpdate?.status !== undefined &&
					requestedUpdate.status !== task.status
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Tasks in completed sprints cannot change status'
					});
				}
			}

			const currentById = new Map(tasks.map((task) => [task.id, task]));
			const changedUpdates = selectChangedTaskOrderUpdates(
				input.updates,
				currentById
			);

			if (changedUpdates.length === 0) {
				return { success: true, updatedCount: 0 };
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.$executeRaw(buildBulkTaskOrderUpdateSql(changedUpdates));
				const changedSprintIds = new Set(
					tasks
						.filter((task) => {
							const update = changedUpdates.find((item) => item.id === task.id);
							return (
								update?.status !== undefined &&
								task.sprint?.status === SprintStatusEnum.ACTIVE &&
								task.sprint.id
							);
						})
						.map((task) => task.sprint?.id)
						.filter((sprintId): sprintId is string => Boolean(sprintId))
				);
				for (const sprintId of changedSprintIds) {
					await captureSprintSnapshot(tx, sprintId);
				}
			});

			return { success: true, updatedCount: changedUpdates.length };
		}),

	delete: protectedProcedure
		.input(z.object({ taskId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { taskId } = input;

			// Verify access through existing task
			const existingTask = await ctx.db.task.findUnique({
				where: { id: taskId },
				include: { sprint: { select: { id: true, status: true } } }
			});

			if (!existingTask) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task not found'
				});
			}

			await assertProjectResourceAccess(ctx, existingTask);
			if (existingTask.projectId) {
				await assertProjectIsActive(ctx.db, existingTask.projectId);
			}

			// Collect storage keys before cascade-deleting attachment rows with the task,
			// then best-effort delete UploadThing blobs after the DB delete succeeds.
			const attachments = await ctx.db.taskAttachment.findMany({
				where: { taskId },
				select: { key: true }
			});
			const attachmentKeys = attachments.map((attachment) => attachment.key);

			if (existingTask.sprint?.status === SprintStatusEnum.COMPLETED) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Tasks in completed sprints cannot be deleted'
				});
			}

			await ctx.db.$transaction(async (tx) => {
				if (existingTask.sprint?.status === SprintStatusEnum.ACTIVE) {
					await tx.sprintChange.create({
						data: {
							sprintId: existingTask.sprint.id,
							taskId,
							authorId: ctx.session.userId,
							type: SprintChangeTypeEnum.TASK_REMOVED,
							previousStoryPoints: existingTask.storyPoints,
							newStoryPoints: null
						}
					});
				}
				await tx.task.delete({ where: { id: taskId } });
				if (existingTask.sprint?.status === SprintStatusEnum.ACTIVE) {
					await captureSprintSnapshot(tx, existingTask.sprint.id);
				}
			});
			await deleteUploadThingFiles(attachmentKeys);

			if (existingTask.projectId) {
				const { getBaseUrl } = await import('~/server/utils/getBaseUrl');
				const baseUrl = getBaseUrl();
				const workspaceUrl = `${baseUrl}/workspace/${existingTask.projectId}?taskId=${taskId}`;

				await ctx.db.notification.deleteMany({
					where: {
						OR: [
							{ type: 'TASK_COMMENT', link: workspaceUrl },
							{
								type: {
									in: ['PR_REQUESTED', 'PR_APPROVED', 'PR_CHANGES_REQUESTED']
								},
								link: { contains: `taskId=${taskId}` }
							}
						]
					}
				});
			}
		}),

	bulkDelete: protectedProcedure
		.input(
			z.object({
				taskIds: z.array(z.string()).min(1).max(100)
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Verify access through existing tasks
			const existingTasks = await ctx.db.task.findMany({
				where: {
					id: {
						in: input.taskIds
					}
				},
				select: {
					id: true,
					projectId: true,
					projectTemplateId: true,
					storyPoints: true,
					sprint: { select: { id: true, status: true } }
				}
			});

			if (existingTasks.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Tasks not found'
				});
			}

			for (const task of existingTasks) {
				await assertProjectResourceAccess(ctx, task);
				if (task.projectId) {
					await assertProjectIsActive(ctx.db, task.projectId);
				}
				if (task.sprint?.status === SprintStatusEnum.COMPLETED) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Tasks in completed sprints cannot be deleted'
					});
				}
			}

			const attachments = await ctx.db.taskAttachment.findMany({
				where: {
					taskId: {
						in: input.taskIds
					}
				},
				select: { key: true }
			});
			const attachmentKeys = attachments.map((attachment) => attachment.key);

			const activeSprintIds = new Set(
				existingTasks
					.filter((task) => task.sprint?.status === SprintStatusEnum.ACTIVE)
					.map((task) => task.sprint?.id)
					.filter((sprintId): sprintId is string => Boolean(sprintId))
			);
			const result = await ctx.db.$transaction(async (tx) => {
				for (const task of existingTasks) {
					if (!task.sprint || task.sprint.status !== SprintStatusEnum.ACTIVE) {
						continue;
					}
					await tx.sprintChange.create({
						data: {
							sprintId: task.sprint.id,
							taskId: task.id,
							authorId: ctx.session.userId,
							type: SprintChangeTypeEnum.TASK_REMOVED,
							previousStoryPoints: task.storyPoints,
							newStoryPoints: null
						}
					});
				}
				const deleted = await tx.task.deleteMany({
					where: { id: { in: input.taskIds } }
				});
				for (const sprintId of activeSprintIds) {
					await captureSprintSnapshot(tx, sprintId);
				}
				return deleted;
			});

			await deleteUploadThingFiles(attachmentKeys);

			return result;
		})
};
