import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { userHasAccessToProject } from '~/server/utils/auth';

export const getProjectQueries = {
	getWorkspaceInfo: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await userHasAccessToProject(ctx, input.id);
			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				select: {
					title: true,
					description: true,
					figmaProjectUrl: true,
					methodology: true,
					accessType: true,
					maxParticipants: true,
					creditCost: true,
					_count: { select: { members: true } }
				}
			});

			return project;
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = ctx.session;

			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				include: {
					category: true,
					epics: true,
					sprints: true,
					members: {
						select: {
							id: true
						}
					},
					tasks: {
						include: {
							assignee: {
								select: {
									id: true,
									name: true
								}
							},
							sprint: {
								select: {
									id: true,
									title: true
								}
							},
							epic: {
								select: {
									id: true,
									title: true
								}
							}
						},
						orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			const isMember = project.members.some((member) => member.id === userId);

			if (!isMember && !ctx.isAdmin) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this project'
				});
			}

			return project;
		}),

	getEnrolled: protectedProcedure.query(({ ctx }) =>
		ctx.db.project.findMany({
			where: { members: { some: { id: ctx.session?.userId } } },
			include: {
				category: {
					select: {
						name: true
					}
				}
			}
		})
	),

	getActiveProjects: adminProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				cursor: z.string().nullish()
			})
		)
		.query(async ({ ctx, input }) => {
			const { limit, cursor } = input;

			const projects = await ctx.db.project.findMany({
				take: limit + 1,
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: {
					updatedAt: 'desc'
				},
				include: {
					category: true,
					tasks: {
						select: {
							id: true,
							status: true
						}
					},
					members: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			let nextCursor: typeof cursor | undefined = undefined;
			if (projects.length > limit) {
				const nextItem = projects.pop();
				if (nextItem) {
					nextCursor = nextItem.id;
				}
			}
			return { projects, nextCursor };
		}),

	getLastActivityDay: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const hasAccess = await userHasAccessToProject(ctx, input.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const lastTask = await ctx.db.task.findFirst({
				where: { projectId: input.projectId },
				orderBy: { updatedAt: 'desc' },
				select: { updatedAt: true }
			});

			const result = lastTask?.updatedAt
				? lastTask.updatedAt.toISOString()
				: null;

			return result;
		}),

	getProjectProgress: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const hasAccess = await userHasAccessToProject(ctx, input.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const tasks = await ctx.db.task.findMany({
				where: { projectId: input.projectId },
				select: { status: true }
			});

			const totalTasks = tasks.length;
			const completedTasks = tasks.filter(
				(task) => task.status === 'DONE'
			).length;
			const progress =
				totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

			return {
				totalTasks,
				completedTasks,
				progress
			};
		}),

	getMembers: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const hasAccess = await userHasAccessToProject(ctx, input.projectId);
			if (!hasAccess) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
			}

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					members: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			return project.members;
		}),

	getMemberManagement: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			if (!ctx.isAdmin) {
				return { canManage: false as const };
			}

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					id: true,
					title: true,
					accessType: true,
					maxParticipants: true,
					creditCost: true,
					members: {
						select: { id: true, name: true, email: true },
						orderBy: { name: 'asc' }
					},
					invitations: {
						where: { status: { in: ['PENDING', 'DECLINED'] } },
						select: {
							id: true,
							status: true,
							creditCostSnapshot: true,
							createdAt: true,
							respondedAt: true,
							user: { select: { id: true, name: true, email: true } },
							invitedBy: { select: { id: true, name: true, email: true } }
						},
						orderBy: { createdAt: 'desc' }
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			return { canManage: true as const, ...project };
		}),

	searchProjectMemberCandidates: adminProcedure
		.input(
			z.object({
				projectId: z.string(),
				search: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const search = input.search?.trim();
			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					accessType: true,
					members: { select: { id: true } },
					invitations: {
						where: { status: { in: ['PENDING', 'DECLINED'] } },
						select: { userId: true, status: true }
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			const users = await ctx.db.user.findMany({
				where: search
					? {
							OR: [
								{ email: { contains: search, mode: 'insensitive' } },
								{ name: { contains: search, mode: 'insensitive' } }
							]
						}
					: undefined,
				select: {
					id: true,
					email: true,
					name: true,
					mentorshipStatus: true
				},
				orderBy: { createdAt: 'desc' },
				take: 8
			});

			const memberIds = new Set(project.members.map((member) => member.id));
			const pendingInviteUserIds = new Set(
				project.invitations
					.filter((invitation) => invitation.status === 'PENDING')
					.map((invitation) => invitation.userId)
			);
			const declinedInviteUserIds = new Set(
				project.invitations
					.filter((invitation) => invitation.status === 'DECLINED')
					.map((invitation) => invitation.userId)
			);

			return users.map((user) => {
				let disabledReason: string | null = null;
				if (memberIds.has(user.id)) {
					disabledReason = 'Already a member';
				} else if (pendingInviteUserIds.has(user.id)) {
					disabledReason = 'Pending invitation';
				} else if (
					project.accessType === 'MENTORSHIP' &&
					user.mentorshipStatus !== 'ACTIVE'
				) {
					disabledReason = 'Mentorship inactive';
				}

				return {
					...user,
					disabledReason,
					note: declinedInviteUserIds.has(user.id)
						? 'Previously declined'
						: null
				};
			});
		}),

	getMyPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.projectInvitation.findMany({
			where: { userId: ctx.session.userId, status: 'PENDING' },
			select: {
				id: true,
				creditCostSnapshot: true,
				createdAt: true,
				project: {
					select: {
						id: true,
						title: true,
						description: true,
						accessType: true,
						category: { select: { name: true } }
					}
				},
				invitedBy: { select: { name: true, email: true } }
			},
			orderBy: { createdAt: 'desc' }
		});
	}),

	getMyProjectInvitation: protectedProcedure
		.input(z.object({ invitationId: z.string() }))
		.query(async ({ ctx, input }) => {
			const invitation = await ctx.db.projectInvitation.findFirst({
				where: { id: input.invitationId, userId: ctx.session.userId },
				select: {
					id: true,
					status: true,
					creditCostSnapshot: true,
					createdAt: true,
					respondedAt: true,
					canceledAt: true,
					project: {
						select: {
							id: true,
							title: true,
							description: true,
							category: { select: { name: true } }
						}
					},
					invitedBy: { select: { name: true, email: true } }
				}
			});

			if (!invitation) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project invitation not found'
				});
			}

			return invitation;
		})
};
