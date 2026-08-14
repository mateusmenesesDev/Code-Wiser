import { Prisma, TaskTypeEnum } from '@prisma/client';
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
import { deleteUploadThingFiles } from '../attachments/taskAttachment.utils';
import {
	buildBulkTaskOrderUpdateSql,
	selectChangedTaskOrderUpdates
} from './taskOrderUpdates';

type RelationshipUpdate = { connect: { id: string } } | { disconnect: true };

const MAX_TRANSACTION_RETRIES = 3;

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

						return prisma.task.create({
							data: {
								...rest,
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
					type: true,
					productVersionId: true,
					title: true,
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

			const updateData = {
				...rest,
				...(type !== undefined && { type }),
				...(createRelationshipUpdate(productVersionId) && {
					productVersion: createRelationshipUpdate(productVersionId)
				}),
				...(assigneeIds !== undefined && {
					assignees: {
						set: assigneeIds.map((assigneeId) => ({ id: assigneeId }))
					}
				}),
				...(createRelationshipUpdate(epicId) && {
					epic: createRelationshipUpdate(epicId)
				}),
				...(createRelationshipUpdate(sprintId) && {
					sprint: createRelationshipUpdate(sprintId)
				})
			};

			const task = await ctx.db.task.update({
				where: { id },
				data: {
					...updateData,
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

			if (existingTask.projectId && existingTask.project) {
				const changedByUser = await ctx.db.user.findUnique({
					where: { id: ctx.session.userId as string },
					select: { name: true }
				});

				const notificationPromises: Promise<void>[] = [];
				const currentAssigneeIds = task.assignees.map((a) => a.id);

				if (assigneeIds !== undefined) {
					const newlyAssignedIds = assigneeIds.filter(
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

	updateTaskOrders: protectedProcedure
		.input(
			z.object({
				updates: z.array(
					z.object({
						id: z.string(),
						order: z.number(),
						status: z.string().optional()
					})
				)
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
					projectTemplateId: true
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
			}

			const currentById = new Map(tasks.map((task) => [task.id, task]));
			const changedUpdates = selectChangedTaskOrderUpdates(
				input.updates,
				currentById
			);

			if (changedUpdates.length === 0) {
				return { success: true, updatedCount: 0 };
			}

			await ctx.db.$executeRaw(buildBulkTaskOrderUpdateSql(changedUpdates));

			return { success: true, updatedCount: changedUpdates.length };
		}),

	delete: protectedProcedure
		.input(z.object({ taskId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { taskId } = input;

			// Verify access through existing task
			const existingTask = await ctx.db.task.findUnique({
				where: { id: taskId }
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

			await ctx.db.task.delete({ where: { id: taskId } });
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
				taskIds: z.array(z.string())
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
					projectId: true,
					projectTemplateId: true
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

			const result = await ctx.db.task.deleteMany({
				where: {
					id: {
						in: input.taskIds
					}
				}
			});

			await deleteUploadThingFiles(attachmentKeys);

			return result;
		})
};
