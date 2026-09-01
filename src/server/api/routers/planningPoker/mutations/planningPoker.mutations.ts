import { SprintChangeTypeEnum, SprintStatusEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
	changeVoteSchema,
	createSessionSchema,
	deleteTaskSchema,
	endSessionSchema,
	finalizeTaskSchema,
	joinSessionSchema,
	updateTaskDescriptionSchema,
	voteSchema
} from '~/features/planningPoker/schemas/planningPoker.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import {
	assertProjectIsActive,
	userHasAccessToProject
} from '~/server/utils/auth';
import { deleteUploadThingFiles } from '../../task/attachments/taskAttachment.utils';
import { captureSprintSnapshot } from '../../sprint/sprintMetrics';

export const planningPokerMutations = {
	createSession: adminProcedure
		.input(createSessionSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session.userId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You must be logged in to create a planning poker session'
				});
			}
			await assertProjectIsActive(ctx.db, input.projectId);

			const activeSession = await ctx.db.planningPokerSession.findFirst({
				where: {
					projectId: input.projectId,
					status: 'ACTIVE'
				}
			});

			if (activeSession) {
				throw new TRPCError({
					code: 'CONFLICT',
					message:
						'There is already an active planning poker session for this project'
				});
			}

			// Verify all tasks belong to the project
			const tasks = await ctx.db.task.findMany({
				where: {
					id: { in: input.taskIds },
					projectId: input.projectId
				},
				select: { id: true }
			});

			if (tasks.length !== input.taskIds.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Some tasks do not belong to this project'
				});
			}

			const session = await ctx.db.planningPokerSession.create({
				data: {
					projectId: input.projectId,
					createdById: ctx.session.userId,
					taskIds: input.taskIds,
					currentTaskIndex: 0,
					status: 'ACTIVE'
				},
				include: {
					project: {
						select: {
							id: true,
							title: true
						}
					},
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			return session;
		}),

	joinSession: protectedProcedure
		.input(joinSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			if (session.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Session is not active'
				});
			}

			const hasAccess = await userHasAccessToProject(ctx, session.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}
			await assertProjectIsActive(ctx.db, session.projectId);

			// Presence membership is tracked by Pusher subscription state.
			return { success: true };
		}),

	vote: protectedProcedure
		.input(voteSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true,
					taskIds: true,
					currentTaskIndex: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			if (session.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Session is not active'
				});
			}

			const hasAccess = await userHasAccessToProject(ctx, session.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}
			await assertProjectIsActive(ctx.db, session.projectId);

			const currentTaskId = session.taskIds[session.currentTaskIndex];
			if (!currentTaskId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'No current task in session'
				});
			}

			// Upsert vote (create or update)
			const vote = await ctx.db.planningPokerVote.upsert({
				where: {
					sessionId_taskId_userId: {
						sessionId: input.sessionId,
						taskId: currentTaskId,
						userId: ctx.session.userId
					}
				},
				update: {
					storyPoints: input.storyPoints ?? null,
					updatedAt: new Date()
				},
				create: {
					sessionId: input.sessionId,
					taskId: currentTaskId,
					userId: ctx.session.userId,
					storyPoints: input.storyPoints ?? null
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			await ctx.realtime.trigger(`presence-planning-poker-${input.sessionId}`, 'vote', {
				sessionId: input.sessionId,
				taskId: currentTaskId,
				userId: vote.user.id,
				storyPoints: vote.storyPoints
			});

			return vote;
		}),

	changeVote: protectedProcedure
		.input(changeVoteSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true,
					taskIds: true,
					currentTaskIndex: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			if (session.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Session is not active'
				});
			}

			const hasAccess = await userHasAccessToProject(ctx, session.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}
			await assertProjectIsActive(ctx.db, session.projectId);

			const currentTaskId = session.taskIds[session.currentTaskIndex];
			if (!currentTaskId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'No current task in session'
				});
			}

			const vote = await ctx.db.planningPokerVote.update({
				where: {
					sessionId_taskId_userId: {
						sessionId: input.sessionId,
						taskId: currentTaskId,
						userId: ctx.session.userId
					}
				},
				data: {
					storyPoints: input.storyPoints ?? null,
					updatedAt: new Date()
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			await ctx.realtime.trigger(`presence-planning-poker-${input.sessionId}`, 'vote', {
				sessionId: input.sessionId,
				taskId: currentTaskId,
				userId: vote.user.id,
				storyPoints: vote.storyPoints
			});

			return vote;
		}),

	updateTaskDescription: adminProcedure
		.input(updateTaskDescriptionSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true,
					taskIds: true,
					currentTaskIndex: true,
					createdById: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			if (session.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Session is not active'
				});
			}

			if (session.createdById !== ctx.session.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only the session creator can edit task descriptions'
				});
			}
			await assertProjectIsActive(ctx.db, session.projectId);

			const currentTaskId = session.taskIds[session.currentTaskIndex];
			if (currentTaskId !== input.taskId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only the current task can be edited'
				});
			}

			const task = await ctx.db.task.update({
				where: { id: input.taskId },
				data: { description: input.description.trim() || null },
				select: {
					id: true,
					description: true
				}
			});
			const updatedTask = { ...task, projectId: session.projectId };

			await ctx.realtime.trigger(
				`presence-planning-poker-${input.sessionId}`,
				'task-description-updated',
				{
					sessionId: input.sessionId,
					taskId: updatedTask.id,
					description: updatedTask.description,
					projectId: updatedTask.projectId
				}
			);

			return updatedTask;
		}),

	deleteTask: adminProcedure
		.input(deleteTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true,
					taskIds: true,
					currentTaskIndex: true,
					createdById: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			if (session.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Session is not active'
				});
			}

			if (session.createdById !== ctx.session.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only the session creator can delete tasks'
				});
			}
			await assertProjectIsActive(ctx.db, session.projectId);

			const currentTaskId = session.taskIds[session.currentTaskIndex];
			if (currentTaskId !== input.taskId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Only the current task can be deleted'
				});
			}

			const existingTask = await ctx.db.task.findUnique({
				where: { id: currentTaskId },
				include: { sprint: { select: { id: true, status: true } } }
			});

			if (!existingTask || existingTask.projectId !== session.projectId) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task not found in this project'
				});
			}

			if (existingTask.sprint?.status === SprintStatusEnum.COMPLETED) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Tasks in completed sprints cannot be deleted'
				});
			}

			const attachments = await ctx.db.taskAttachment.findMany({
				where: { taskId: currentTaskId },
				select: { key: true }
			});
			const attachmentKeys = attachments.map((attachment) => attachment.key);
			const remainingTaskIds = session.taskIds.filter(
				(taskId) => taskId !== currentTaskId
			);
			const isSessionComplete =
				session.currentTaskIndex >= remainingTaskIds.length;
			const nextTaskIndex = isSessionComplete
				? null
				: session.currentTaskIndex;

			const updatedSession = await ctx.db.$transaction(async (tx) => {
				const updated = await tx.planningPokerSession.update({
					where: { id: input.sessionId },
					data: {
						taskIds: remainingTaskIds,
						currentTaskIndex: session.currentTaskIndex,
						status: isSessionComplete ? 'COMPLETED' : 'ACTIVE'
					},
					select: {
						taskIds: true,
						currentTaskIndex: true,
						status: true
					}
				});

				if (existingTask.sprint?.status === SprintStatusEnum.ACTIVE) {
					await tx.sprintChange.create({
						data: {
							sprintId: existingTask.sprint.id,
							taskId: currentTaskId,
							authorId: ctx.session.userId,
							type: SprintChangeTypeEnum.TASK_REMOVED,
							previousStoryPoints: existingTask.storyPoints,
							newStoryPoints: null
						}
					});
				}

				await tx.task.delete({ where: { id: currentTaskId } });

				if (existingTask.sprint?.status === SprintStatusEnum.ACTIVE) {
					await captureSprintSnapshot(tx, existingTask.sprint.id);
				}

				return updated;
			});

			await deleteUploadThingFiles(attachmentKeys);

			const { getBaseUrl } = await import('~/server/utils/getBaseUrl');
			const workspaceUrl = `${getBaseUrl()}/workspace/${session.projectId}?taskId=${currentTaskId}`;
			await ctx.db.notification.deleteMany({
				where: {
					OR: [
						{ type: 'TASK_COMMENT', link: workspaceUrl },
						{
							type: {
								in: ['PR_REQUESTED', 'PR_APPROVED', 'PR_CHANGES_REQUESTED']
							},
							link: { contains: `taskId=${currentTaskId}` }
						}
					]
				}
			});

			await ctx.realtime.trigger(
				`presence-planning-poker-${input.sessionId}`,
				'task-deleted',
				{
					sessionId: input.sessionId,
					taskId: currentTaskId,
					nextTaskIndex,
					projectId: session.projectId
				}
			);

			return {
				session: updatedSession,
				isSessionComplete,
				nextTaskIndex,
				projectId: session.projectId
			};
		}),

	finalizeTask: adminProcedure
		.input(finalizeTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true,
					taskIds: true,
					currentTaskIndex: true,
					createdById: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			if (session.status !== 'ACTIVE') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Session is not active'
				});
			}

			// Only the creator (admin) can finalize
			if (session.createdById !== ctx.session.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only the session creator can finalize tasks'
				});
			}
			await assertProjectIsActive(ctx.db, session.projectId);

			const currentTaskId = session.taskIds[session.currentTaskIndex];
			if (!currentTaskId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'No current task in session'
				});
			}

			// Update task with final story points
			if (input.finalStoryPoints !== undefined) {
				await ctx.db.task.update({
					where: { id: currentTaskId },
					data: { storyPoints: input.finalStoryPoints }
				});
			}

			// Move to next task or complete session
			const nextIndex = session.currentTaskIndex + 1;
			const isLastTask = nextIndex >= session.taskIds.length;

			const updatedSession = await ctx.db.planningPokerSession.update({
				where: { id: input.sessionId },
				data: {
					currentTaskIndex: isLastTask ? session.currentTaskIndex : nextIndex,
					status: isLastTask ? 'COMPLETED' : 'ACTIVE'
				},
				include: {
					project: {
						select: {
							id: true,
							title: true
						}
					}
				}
			});

			await ctx.realtime.trigger(
				`presence-planning-poker-${input.sessionId}`,
				'task-finalized',
				{
					sessionId: input.sessionId,
					taskId: currentTaskId,
					finalStoryPoints: input.finalStoryPoints ?? null,
					nextTaskIndex: isLastTask ? null : nextIndex
				}
			);

			return {
				session: updatedSession,
				isLastTask,
				nextTaskId: isLastTask ? null : (session.taskIds[nextIndex] ?? null)
			};
		}),

	endSession: adminProcedure
		.input(endSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					status: true,
					createdById: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			// Only the creator (admin) can end session
			if (session.createdById !== ctx.session.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only the session creator can end the session'
				});
			}

			await assertProjectIsActive(ctx.db, session.projectId);

			const updatedSession = await ctx.db.planningPokerSession.update({
				where: { id: input.sessionId },
				data: {
					status: 'COMPLETED'
				}
			});

			await ctx.realtime.trigger(
				`presence-planning-poker-${input.sessionId}`,
				'session-ended',
				{
					sessionId: input.sessionId
				}
			);

			return updatedSession;
		})
};
