import { TRPCError } from '@trpc/server';
import {
	changeVoteSchema,
	createSessionSchema,
	endSessionSchema,
	finalizeTaskSchema,
	joinSessionSchema,
	voteSchema
} from '~/features/planningPoker/schemas/planningPoker.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

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

			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId },
				select: {
					id: true,
					name: true,
					email: true
				}
			});

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

			if (user) {
				await ctx.realtime.trigger(
					`planning-poker-${session.id}`,
					'member-joined',
					{
						sessionId: session.id,
						userId: user.id,
						userName: user.name,
						userEmail: user.email
					}
				);
			}

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

			// Get user info for broadcast
			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId },
				select: {
					id: true,
					name: true,
					email: true
				}
			});

			if (user) {
				await ctx.realtime.trigger(
					`planning-poker-${input.sessionId}`,
					'member-joined',
					{
						sessionId: input.sessionId,
						userId: user.id,
						userName: user.name,
						userEmail: user.email
					}
				);
			}

			// Join is implicit - just return success
			// The actual participation is tracked when user votes
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

			await ctx.realtime.trigger(`planning-poker-${input.sessionId}`, 'vote', {
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

			await ctx.realtime.trigger(`planning-poker-${input.sessionId}`, 'vote', {
				sessionId: input.sessionId,
				taskId: currentTaskId,
				userId: vote.user.id,
				storyPoints: vote.storyPoints
			});

			return vote;
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
				`planning-poker-${input.sessionId}`,
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

			const updatedSession = await ctx.db.planningPokerSession.update({
				where: { id: input.sessionId },
				data: {
					status: 'COMPLETED'
				}
			});

			await ctx.realtime.trigger(
				`planning-poker-${input.sessionId}`,
				'session-ended',
				{
					sessionId: input.sessionId
				}
			);

			return updatedSession;
		})
};
