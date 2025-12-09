import { TRPCError } from '@trpc/server';
import {
	getActiveSessionSchema,
	getSessionSchema,
	getSessionVotesSchema
} from '~/features/planningPoker/schemas/planningPoker.schema';
import { protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

export const planningPokerQueries = {
	getActiveSession: protectedProcedure
		.input(getActiveSessionSchema)
		.query(async ({ ctx, input }) => {
			const hasAccess = await userHasAccessToProject(ctx, input.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const session = await ctx.db.planningPokerSession.findFirst({
				where: {
					projectId: input.projectId,
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
					},
					votes: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true
								}
							},
							task: {
								select: {
									id: true,
									title: true,
									description: true
								}
							}
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			});

			return session;
		}),

	getSession: protectedProcedure
		.input(getSessionSchema)
		.query(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
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
					},
					votes: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true
								}
							},
							task: {
								select: {
									id: true,
									title: true,
									description: true
								}
							}
						}
					}
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			const hasAccess = await userHasAccessToProject(ctx, session.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			return session;
		}),

	getSessionVotes: protectedProcedure
		.input(getSessionVotesSchema)
		.query(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			const hasAccess = await userHasAccessToProject(ctx, session.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const votes = await ctx.db.planningPokerVote.findMany({
				where: {
					sessionId: input.sessionId,
					taskId: input.taskId
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				},
				orderBy: {
					createdAt: 'asc'
				}
			});

			return votes;
		}),

	getSessionParticipants: protectedProcedure
		.input(getSessionSchema)
		.query(async ({ ctx, input }) => {
			const session = await ctx.db.planningPokerSession.findUnique({
				where: { id: input.sessionId },
				select: {
					projectId: true,
					createdById: true
				}
			});

			if (!session) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Session not found'
				});
			}

			const hasAccess = await userHasAccessToProject(ctx, session.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			// Get all unique users who have voted in this session (participants)
			// First get unique userIds
			const uniqueUserIds = await ctx.db.planningPokerVote.findMany({
				where: {
					sessionId: input.sessionId
				},
				select: {
					userId: true
				},
				distinct: ['userId']
			});

			// Get unique user IDs
			const userIds = [...new Set(uniqueUserIds.map((v) => v.userId))];

			// Fetch user details for all unique participants
			const participantsMap = new Map<
				string,
				{ id: string; name: string | null; email: string }
			>();

			if (userIds.length > 0) {
				const users = await ctx.db.user.findMany({
					where: {
						id: { in: userIds }
					},
					select: {
						id: true,
						name: true,
						email: true
					}
				});

				for (const user of users) {
					participantsMap.set(user.id, {
						id: user.id,
						name: user.name,
						email: user.email
					});
				}
			}

			// Also include the session creator if they haven't voted yet
			if (session.createdById && !participantsMap.has(session.createdById)) {
				const creator = await ctx.db.user.findUnique({
					where: { id: session.createdById },
					select: {
						id: true,
						name: true,
						email: true
					}
				});

				if (creator) {
					participantsMap.set(creator.id, {
						id: creator.id,
						name: creator.name,
						email: creator.email
					});
				}
			}

			return Array.from(participantsMap.values());
		})
};
