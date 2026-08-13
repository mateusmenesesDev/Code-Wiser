import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	adminProcedure,
	protectedProcedure,
	publicProcedure
} from '~/server/api/trpc';
import { getPortfolioCompletion } from '~/features/portfolio/utils/completion';
import { getPublicPortfolioByCode } from '~/server/services/portfolio';
import {
	assertProjectPermission,
	getProjectMembership,
	userHasAccessToProject
} from '~/server/utils/auth';
import { buildEnrolledProjectStats } from './enrolledProjectStats';

export const getProjectQueries = {
	getWorkspaceInfo: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const membership = await getProjectMembership(ctx, input.id);
			if (!membership) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this project'
				});
			}
			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				select: {
					title: true,
					description: true,
					figmaProjectUrl: true,
					githubRepository: {
						select: { id: true, fullName: true, htmlUrl: true }
					},
					methodology: true,
					accessType: true,
					maxParticipants: true,
					creditCost: true,
					canceledAt: true,
					cancellationReason: true,
					refundCreditsOnCancellation: true,
					refundedCreditsOnCancellation: true,
					memberships: {
						where: { status: 'ACTIVE' },
						select: { id: true }
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			const { memberships, ...projectInfo } = project;
			return {
				...projectInfo,
				_count: { members: memberships.length },
				permissions: membership.permissions
			};
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				include: {
					category: true,
					epics: true,
					sprints: true,
					memberships: {
						where: { status: 'ACTIVE' },
						select: { userId: true }
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			await userHasAccessToProject(ctx, input.id);

			const { memberships, ...projectInfo } = project;
			return {
				...projectInfo,
				members: memberships.map((membership) => ({ id: membership.userId }))
			};
		}),

	getEnrolled: protectedProcedure.query(async ({ ctx }) => {
		const projects = await ctx.db.project.findMany({
			where: {
				canceledAt: null,
				memberships: {
					some: { userId: ctx.session.userId, status: 'ACTIVE' }
				}
			},
			include: {
				category: {
					select: {
						name: true
					}
				}
			}
		});

		if (projects.length === 0) {
			return [];
		}

		const projectIds = projects.map((project) => project.id);

		const [statusGroups, lastActivityGroups] = await Promise.all([
			ctx.db.task.groupBy({
				by: ['projectId', 'status'],
				where: { projectId: { in: projectIds } },
				_count: { _all: true }
			}),
			ctx.db.task.groupBy({
				by: ['projectId'],
				where: { projectId: { in: projectIds } },
				_max: { updatedAt: true }
			})
		]);

		const lastActivityByProjectId: Record<string, Date | null | undefined> = {};
		for (const row of lastActivityGroups) {
			if (row.projectId) {
				lastActivityByProjectId[row.projectId] = row._max.updatedAt;
			}
		}

		const stats = buildEnrolledProjectStats({
			projectIds,
			statusCounts: statusGroups.map((row) => ({
				projectId: row.projectId,
				status: row.status,
				count: row._count._all
			})),
			lastActivityByProjectId
		});

		return projects.map((project) => ({
			...project,
			...stats[project.id]
		}));
	}),

	getActiveProjects: adminProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				cursor: z.string().nullish(),
				status: z.enum(['active', 'canceled', 'all']).default('active'),
				search: z.string().trim().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const { limit, cursor } = input;
			const search = input.search?.trim();

			const statusWhere =
				input.status === 'active'
					? { canceledAt: null }
					: input.status === 'canceled'
						? { canceledAt: { not: null } }
						: {};

			const searchWhere = search
				? {
						OR: [
							{ title: { contains: search, mode: 'insensitive' as const } },
							{
								memberships: {
									some: {
										status: 'ACTIVE' as const,
										user: {
											OR: [
												{
													name: {
														contains: search,
														mode: 'insensitive' as const
													}
												},
												{
													email: {
														contains: search,
														mode: 'insensitive' as const
													}
												}
											]
										}
									}
								}
							}
						]
					}
				: {};

			const projects = await ctx.db.project.findMany({
				where: {
					...statusWhere,
					...searchWhere
				},
				take: limit + 1,
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: {
					updatedAt: 'desc'
				},
				include: {
					category: true,
					memberships: {
						where: { status: 'ACTIVE' },
						select: {
							role: true,
							user: { select: { id: true, name: true, email: true } }
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

			if (projects.length === 0) {
				return { projects: [], nextCursor };
			}

			const projectIds = projects.map((project) => project.id);
			const statusGroups = await ctx.db.task.groupBy({
				by: ['projectId', 'status'],
				where: { projectId: { in: projectIds } },
				_count: { _all: true }
			});

			const stats = buildEnrolledProjectStats({
				projectIds,
				statusCounts: statusGroups.map((row) => ({
					projectId: row.projectId,
					status: row.status,
					count: row._count._all
				})),
				lastActivityByProjectId: {}
			});

			return {
				projects: projects.map((project) => {
					const projectStats = stats[project.id];
					const { memberships, ...projectInfo } = project;
					return {
						...projectInfo,
						members: memberships.map(({ user, role }) => ({ ...user, role })),
						totalTasks: projectStats?.totalTasks ?? 0,
						completedTasks: projectStats?.completedTasks ?? 0,
						progress: projectStats?.progress ?? 0
					};
				}),
				nextCursor
			};
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

	getPortfolioSettings: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const membership = await getProjectMembership(ctx, input.projectId);
			if (!membership) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this project'
				});
			}

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					id: true,
					publicCode: true,
					portfolioSummary: true,
					portfolioDemoUrl: true,
					portfolioPublishedAt: true,
					portfolioShowDemo: true,
					portfolioShowRepository: true,
					portfolioFeedback: true,
					portfolioEvaluatedAt: true,
					portfolioEvaluatedBy: { select: { name: true } },
					githubRepository: { select: { htmlUrl: true, private: true } },
					technologies: {
						select: { id: true, name: true },
						orderBy: { name: 'asc' }
					},
					tasks: {
						select: {
							id: true,
							title: true,
							status: true,
							portfolioRelevant: true,
							reviews: {
								where: { isActive: true },
								select: { status: true }
							}
						}
					},
					milestones: {
						orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
						select: { id: true, title: true, reviewedAt: true }
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			const completion = getPortfolioCompletion({
				taskCount: project.tasks.length,
				incompleteTaskCount: project.tasks.filter(
					(task) => task.status !== 'DONE'
				).length,
				milestoneCount: project.milestones.length,
				unreviewedMilestoneCount: project.milestones.filter(
					(milestone) => milestone.reviewedAt === null
				).length,
				pendingReviewCount: project.tasks
					.flatMap((task) => task.reviews)
					.filter((review) => review.status === 'PENDING').length,
				hasMentorEvaluation: Boolean(
					project.portfolioFeedback?.trim() && project.portfolioEvaluatedAt
				)
			});

			return {
				...project,
				canManage: membership.permissions.includes('MANAGE_PORTFOLIO'),
				canEvaluate: membership.permissions.includes('EVALUATE_PROJECT'),
				completion
			};
		}),

	getPublicPortfolio: publicProcedure
		.input(z.object({ publicCode: z.string().min(1).max(40) }))
		.query(async ({ ctx, input }) => {
			const portfolio = await getPublicPortfolioByCode(
				ctx.db,
				input.publicCode
			);
			if (!portfolio) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Portfolio not found'
				});
			}
			return portfolio;
		}),

	getRoadmap: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			await userHasAccessToProject(ctx, input.projectId);

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					id: true,
					title: true,
					canceledAt: true,
					learningOutcomes: {
						orderBy: { createdAt: 'asc' },
						select: { id: true, value: true }
					},
					milestones: {
						orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
						select: {
							id: true,
							title: true,
							description: true,
							order: true,
							reviewedAt: true,
							reviewedBy: { select: { id: true, name: true } },
							tasks: {
								select: {
									id: true,
									title: true,
									status: true,
									blocked: true
								}
							},
							epics: {
								select: {
									id: true,
									title: true,
									tasks: {
										select: {
											id: true,
											title: true,
											status: true,
											blocked: true
										}
									}
								}
							},
							sprints: {
								select: {
									id: true,
									title: true,
									tasks: {
										select: {
											id: true,
											title: true,
											status: true,
											blocked: true
										}
									}
								}
							}
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

			return {
				...project,
				milestones: project.milestones.map((milestone) => {
					const tasks = [
						...milestone.tasks,
						...milestone.epics.flatMap((epic) => epic.tasks),
						...milestone.sprints.flatMap((sprint) => sprint.tasks)
					];
					const uniqueTasks = [
						...new Map(tasks.map((task) => [task.id, task])).values()
					];
					const doneCount = uniqueTasks.filter(
						(task) => task.status === 'DONE'
					).length;

					return {
						id: milestone.id,
						title: milestone.title,
						description: milestone.description,
						order: milestone.order,
						reviewedAt: milestone.reviewedAt,
						reviewedBy: milestone.reviewedBy,
						taskCount: uniqueTasks.length,
						doneCount,
						progress: uniqueTasks.length
							? Math.round((doneCount / uniqueTasks.length) * 100)
							: 0,
						blockedTaskCount: uniqueTasks.filter((task) => task.blocked).length,
						tasks: uniqueTasks,
						epics: milestone.epics.map(({ tasks: _tasks, ...epic }) => epic),
						sprints: milestone.sprints.map(
							({ tasks: _tasks, ...sprint }) => sprint
						)
					};
				})
			};
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
					memberships: {
						where: { status: 'ACTIVE' },
						select: {
							role: true,
							user: { select: { id: true, name: true, email: true } }
						},
						orderBy: { user: { name: 'asc' } }
					}
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}

			return project.memberships.map(({ user, role }) => ({ ...user, role }));
		}),

	getMemberManagement: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const membership = await getProjectMembership(ctx, input.projectId);
			if (!membership?.permissions.includes('MANAGE_MEMBERS')) {
				return { canManage: false as const };
			}

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					id: true,
					title: true,
					canceledAt: true,
					cancellationReason: true,
					accessType: true,
					maxParticipants: true,
					creditCost: true,
					memberships: {
						where: { status: 'ACTIVE' },
						select: {
							role: true,
							joinedAt: true,
							user: { select: { id: true, name: true, email: true } }
						},
						orderBy: { user: { name: 'asc' } }
					},
					invitations: {
						where: { status: { in: ['PENDING', 'DECLINED'] } },
						select: {
							id: true,
							status: true,
							creditCostSnapshot: true,
							role: true,
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

			const memberIds = project.memberships.map(({ user }) => user.id);
			const [paymentEvidences, acceptedCreditInvitations, assignedTasks] =
				await Promise.all([
					ctx.db.projectCreditPaymentEvidence.findMany({
						where: {
							projectId: input.projectId,
							userId: { in: memberIds },
							credits: { gt: 0 },
							memberRemovalAudit: null
						},
						select: { id: true, userId: true, credits: true, createdAt: true },
						orderBy: { createdAt: 'desc' }
					}),
					ctx.db.projectInvitation.findMany({
						where: {
							projectId: input.projectId,
							status: 'ACCEPTED',
							creditCostSnapshot: { gt: 0 },
							userId: { in: memberIds },
							memberRemovalAudit: null,
							creditPaymentEvidence: null
						},
						select: {
							id: true,
							userId: true,
							creditCostSnapshot: true,
							respondedAt: true
						},
						orderBy: { respondedAt: 'desc' }
					}),
					ctx.db.task.findMany({
						where: {
							projectId: input.projectId,
							assignees: { some: { id: { in: memberIds } } }
						},
						select: {
							assignees: {
								where: { id: { in: memberIds } },
								select: { id: true }
							}
						}
					})
				]);

			const refundableCreditsByUserId = new Map<string, number>();
			for (const evidence of paymentEvidences) {
				if (!refundableCreditsByUserId.has(evidence.userId)) {
					refundableCreditsByUserId.set(evidence.userId, evidence.credits);
				}
			}
			for (const invitation of acceptedCreditInvitations) {
				if (refundableCreditsByUserId.has(invitation.userId)) {
					continue;
				}
				refundableCreditsByUserId.set(
					invitation.userId,
					invitation.creditCostSnapshot ?? 0
				);
			}

			const assignedTaskCountByUserId = new Map<string, number>();
			for (const task of assignedTasks) {
				for (const assignee of task.assignees) {
					assignedTaskCountByUserId.set(
						assignee.id,
						(assignedTaskCountByUserId.get(assignee.id) ?? 0) + 1
					);
				}
			}

			const { memberships, ...projectInfo } = project;
			return {
				canManage: true as const,
				...projectInfo,
				currentUserId: ctx.session.userId,
				members: memberships.map(({ user, role, joinedAt }) => {
					const refundableCredits = refundableCreditsByUserId.get(user.id) ?? 0;
					return {
						...user,
						role,
						status: 'ACTIVE' as const,
						joinedAt,
						permissions:
							role === 'OWNER'
								? [
										'EDIT_SETTINGS',
										'MANAGE_MEMBERS',
										'MANAGE_GITHUB',
										'MANAGE_PORTFOLIO'
									]
								: role === 'MENTOR'
									? ['EDIT_SETTINGS', 'MANAGE_GITHUB', 'EVALUATE_PROJECT']
									: [],
						assignedTaskCount: assignedTaskCountByUserId.get(user.id) ?? 0,
						refundableCredits,
						refundUnavailableReason:
							project.accessType === 'CREDITS' && refundableCredits === 0
								? 'No credit payment evidence found'
								: null
					};
				})
			};
		}),

	searchProjectMemberCandidates: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				search: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_MEMBERS');
			const search = input.search?.trim();
			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					accessType: true,
					canceledAt: true,
					memberships: {
						where: { status: 'ACTIVE' },
						select: { userId: true }
					},
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

			const memberIds = new Set(
				project.memberships.map(({ userId }) => userId)
			);
			const projectCanceled = project.canceledAt !== null;
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
				if (projectCanceled) {
					disabledReason = 'Project canceled';
				} else if (memberIds.has(user.id)) {
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
			where: {
				userId: ctx.session.userId,
				status: 'PENDING',
				project: { canceledAt: null }
			},
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
