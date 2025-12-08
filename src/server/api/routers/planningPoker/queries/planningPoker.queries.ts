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
		})
};
