import { randomUUID } from 'node:crypto';
import { type Prisma, ProjectRoleEnum } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createProjectSchema,
	evaluatePortfolioSchema,
	updatePortfolioSchema,
	updateProjectSchema
} from '~/features/projects/schemas/projects.schema';
import { generatePublicCode } from '~/lib/publicTaskId';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { applyCreditTransaction } from '~/server/services/creditLedger';
import { createNotification } from '~/server/services/notification/base';
import {
	assertProjectIsActive,
	assertProjectPermission
} from '~/server/utils/auth';

const canceledProjectError = () =>
	new TRPCError({
		code: 'BAD_REQUEST',
		message: 'Project is canceled'
	});

const CREATE_PROJECT_TRANSACTION_TIMEOUT_MS = 20_000;

const makeUniqueProjectPublicCode = async (
	prisma: Prisma.TransactionClient,
	preferredCode: string | null | undefined,
	fallbackTitle: string
): Promise<string> => {
	const baseCode = generatePublicCode(preferredCode ?? fallbackTitle);
	let publicCode = baseCode;
	let suffix = 2;

	while (
		await prisma.project.findUnique({
			where: { publicCode },
			select: { id: true }
		})
	) {
		publicCode = `${baseCode}_${suffix}`;
		suffix += 1;
	}

	return publicCode;
};

export const projectMutations = {
	createProject: protectedProcedure
		.input(createProjectSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { userId } = ctx.session;
				const creationIdempotencyKey = input.idempotencyKey;

				const existingProject = await ctx.db.project.findUnique({
					where: { creationIdempotencyKey },
					select: {
						id: true,
						memberships: {
							where: { status: 'ACTIVE' },
							select: { userId: true }
						}
					}
				});
				if (existingProject) {
					if (
						existingProject.memberships.some(
							(membership) => membership.userId === userId
						)
					) {
						return existingProject.id;
					}
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Project creation key belongs to another user'
					});
				}

				const [user, projectTemplate] = await Promise.all([
					ctx.db.user.findUnique({
						where: { id: userId }
					}),
					ctx.db.projectTemplate.findUnique({
						where: {
							id: input.projectTemplateId
						},
						include: {
							sprints: true,
							epics: true,
							tasks: true,
							productVersions: true,
							milestones: true,
							learningOutcomes: true,
							technologies: true
						}
					})
				]);

				if (!user) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'User not found'
					});
				}

				if (!projectTemplate) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Project template not found'
					});
				}

				if (
					projectTemplate.accessType === 'MENTORSHIP' &&
					user.mentorshipStatus !== 'ACTIVE'
				) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'User does not have access to this project template'
					});
				}

				const userHasProject = await ctx.db.project.findFirst({
					where: {
						title: projectTemplate.title,
						memberships: {
							some: { userId: user.id, status: 'ACTIVE' }
						}
					}
				});
				if (userHasProject) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'User already has a project with this template'
					});
				}

				const templateSprints = projectTemplate.sprints;
				const templateEpics = projectTemplate.epics;
				const templateTasks = projectTemplate.tasks;
				const templateProductVersions = projectTemplate.productVersions ?? [];
				const templateMilestones = projectTemplate.milestones ?? [];
				const templateLearningOutcomes = projectTemplate.learningOutcomes ?? [];
				const templateTechnologies = projectTemplate.technologies ?? [];

				const project = await ctx.db.$transaction(
					async (prisma) => {
						const newProject = await prisma.project.create({
							data: {
								title: projectTemplate.title,
								description: projectTemplate.description,
								methodology: projectTemplate.methodology,
								minParticipants: projectTemplate.minParticipants,
								maxParticipants: projectTemplate.maxParticipants,
								accessType: projectTemplate.accessType,
								difficulty: projectTemplate.difficulty,
								creditCost: projectTemplate.credits,
								creationIdempotencyKey,
								figmaProjectUrl: projectTemplate.figmaProjectUrl,
								sourceProjectTemplateId: projectTemplate.id,
								publicCode: await makeUniqueProjectPublicCode(
									prisma,
									projectTemplate.publicCode,
									projectTemplate.title
								),
								nextTaskNumber: projectTemplate.nextTaskNumber,
								categoryId: projectTemplate.categoryId,
								technologies: {
									connect: templateTechnologies.map(({ id }) => ({ id }))
								},
								memberships: {
									create: { userId: user.id, role: ProjectRoleEnum.OWNER }
								}
							}
						});

						const productVersionIdMap: Record<string, string> = {};
						if (templateProductVersions.length > 0) {
							await prisma.productVersion.createMany({
								data: templateProductVersions.map((version) => {
									const newId = randomUUID();
									productVersionIdMap[version.id] = newId;
									return {
										id: newId,
										name: version.name,
										description: version.description,
										order: version.order,
										status: 'PLANNED',
										projectId: newProject.id,
										projectTemplateId: null
									};
								})
							});
						}

						const milestoneIdMap: Record<string, string> = {};
						if (templateMilestones.length > 0) {
							await prisma.milestone.createMany({
								data: templateMilestones.map((milestone) => {
									const newId = randomUUID();
									milestoneIdMap[milestone.id] = newId;

									return {
										id: newId,
										title: milestone.title,
										description: milestone.description,
										order: milestone.order,
										status: 'PENDING',
										completed: false,
										projectId: newProject.id,
										projectTemplateId: null
									};
								})
							});
						}

						if (templateLearningOutcomes.length > 0) {
							await prisma.learningOutcome.createMany({
								data: templateLearningOutcomes.map((outcome) => ({
									id: randomUUID(),
									value: outcome.value,
									projectId: newProject.id,
									projectTemplateId: null
								}))
							});
						}

						const sprintIdMap: Record<string, string> = {};
						if (templateSprints.length > 0) {
							await prisma.sprint.createMany({
								data: templateSprints.map((sprint) => {
									const {
										id: oldId,
										projectTemplateId,
										milestoneId,
										...sprintData
									} = sprint;
									const newId = randomUUID();
									sprintIdMap[oldId] = newId;

									return {
										...sprintData,
										id: newId,
										projectId: newProject.id,
										projectTemplateId: null,
										milestoneId: milestoneId
											? (milestoneIdMap[milestoneId] ?? null)
											: null
									};
								})
							});
						}

						const epicIdMap: Record<string, string> = {};
						if (templateEpics.length > 0) {
							await prisma.epic.createMany({
								data: templateEpics.map((epic) => {
									const {
										id: oldId,
										projectTemplateId,
										milestoneId,
										...epicData
									} = epic;
									const newId = randomUUID();
									epicIdMap[oldId] = newId;

									return {
										...epicData,
										id: newId,
										projectId: newProject.id,
										projectTemplateId: null,
										milestoneId: milestoneId
											? (milestoneIdMap[milestoneId] ?? null)
											: null
									};
								})
							});
						}

						if (templateTasks.length > 0) {
							const createdTaskIds: string[] = [];
							await prisma.task.createMany({
								data: templateTasks.map((task) => {
									const {
										id: _taskId,
										epicId,
										sprintId,
										milestoneId,
										productVersionId,
										projectTemplateId,
										...taskData
									} = task;
									const newId = randomUUID();
									createdTaskIds.push(newId);

									return {
										...taskData,
										id: newId,
										projectId: newProject.id,
										epicId: epicId ? (epicIdMap[epicId] ?? null) : null,
										sprintId: sprintId ? (sprintIdMap[sprintId] ?? null) : null,
										milestoneId: milestoneId
											? (milestoneIdMap[milestoneId] ?? null)
											: null,
										productVersionId: productVersionId
											? (productVersionIdMap[productVersionId] ?? null)
											: null,
										projectTemplateId: null
									};
								})
							});

							await prisma.user.update({
								where: { id: user.id },
								data: {
									tasks: {
										connect: createdTaskIds.map((id) => ({ id }))
									}
								}
							});
						}

						if (
							projectTemplate.accessType === 'CREDITS' &&
							user.mentorshipStatus !== 'ACTIVE'
						) {
							const credits = projectTemplate.credits ?? 0;
							if (credits > 0) {
								const transaction = await applyCreditTransaction(prisma, {
									userId: user.id,
									type: 'CONSUMPTION',
									value: -credits,
									source: 'PROJECT_CREATION',
									externalReference: newProject.id,
									idempotencyKey: `project:create:${creationIdempotencyKey}`
								});

								if (transaction.applied) {
									await prisma.projectCreditPaymentEvidence.create({
										data: {
											projectId: newProject.id,
											userId: user.id,
											credits,
											source: 'PROJECT_CREATION',
											creditTransactionId: transaction.transactionId
										}
									});
								}
							}
						}

						return newProject;
					},
					{ timeout: CREATE_PROJECT_TRANSACTION_TIMEOUT_MS }
				);

				return project.id;
			} catch (error) {
				console.error('Create project error:', error);
				throw error;
			}
		}),

	reorderMilestones: adminProcedure
		.input(
			z.object({
				projectId: z.string(),
				items: z
					.array(
						z.object({
							id: z.string(),
							order: z.number().int().min(0)
						})
					)
					.min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			await assertProjectIsActive(ctx.db, input.projectId);

			const ids = input.items.map((item) => item.id);
			if (
				new Set(ids).size !== ids.length ||
				!input.items.every((item, index) => item.order === index)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Milestone order must contain each position exactly once'
				});
			}

			const milestones = await ctx.db.milestone.findMany({
				where: { projectId: input.projectId },
				select: { id: true }
			});
			if (
				milestones.length !== input.items.length ||
				!input.items.every((item) =>
					milestones.some(({ id }) => id === item.id)
				)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Milestones do not belong to this project'
				});
			}

			await ctx.db.$transaction(
				input.items.map((item) =>
					ctx.db.milestone.update({
						where: { id: item.id },
						data: { order: item.order }
					})
				)
			);

			return { success: true as const };
		}),

	markMilestoneReviewed: adminProcedure
		.input(
			z.object({
				milestoneId: z.string(),
				reviewed: z.boolean()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const milestone = await ctx.db.milestone.findUnique({
				where: { id: input.milestoneId },
				select: { id: true, projectId: true }
			});
			if (!milestone?.projectId) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project milestone not found'
				});
			}

			await assertProjectIsActive(ctx.db, milestone.projectId);

			return ctx.db.milestone.update({
				where: { id: milestone.id },
				data: {
					reviewedAt: input.reviewed ? new Date() : null,
					reviewedById: input.reviewed ? ctx.session.userId : null
				},
				select: {
					id: true,
					reviewedAt: true,
					reviewedBy: { select: { id: true, name: true } }
				}
			});
		}),

	updatePortfolio: protectedProcedure
		.input(updatePortfolioSchema)
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_PORTFOLIO');
			await assertProjectIsActive(ctx.db, input.projectId);

			const project = await ctx.db.project.findUnique({
				where: { id: input.projectId },
				select: {
					id: true,
					publicCode: true,
					portfolioPublishedAt: true,
					githubRepository: { select: { private: true } }
				}
			});

			if (!project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Project not found'
				});
			}
			if (input.published && !project.publicCode) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'This project does not have a public portfolio identifier'
				});
			}
			if (input.showDemo && !input.demoUrl) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Add a demo URL before showing it on the portfolio'
				});
			}
			if (
				input.showRepository &&
				(!project.githubRepository || project.githubRepository.private)
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message:
						'Only a linked public repository can be shown on the portfolio'
				});
			}

			const relevantTaskIds = [...new Set(input.relevantTaskIds)];
			const tasks = await ctx.db.task.findMany({
				where: { projectId: input.projectId, id: { in: relevantTaskIds } },
				select: { id: true }
			});
			if (tasks.length !== relevantTaskIds.length) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'A selected portfolio task does not belong to this project'
				});
			}

			return ctx.db.$transaction(async (prisma) => {
				await prisma.task.updateMany({
					where: { projectId: input.projectId },
					data: { portfolioRelevant: false }
				});
				if (relevantTaskIds.length > 0) {
					await prisma.task.updateMany({
						where: { projectId: input.projectId, id: { in: relevantTaskIds } },
						data: { portfolioRelevant: true }
					});
				}

				return prisma.project.update({
					where: { id: input.projectId },
					data: {
						portfolioSummary: input.summary?.trim() || null,
						portfolioDemoUrl: input.demoUrl,
						portfolioPublishedAt: input.published
							? (project.portfolioPublishedAt ?? new Date())
							: null,
						portfolioShowDemo: input.showDemo,
						portfolioShowRepository: input.showRepository
					},
					select: {
						id: true,
						publicCode: true,
						portfolioPublishedAt: true
					}
				});
			});
		}),

	evaluatePortfolio: protectedProcedure
		.input(evaluatePortfolioSchema)
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'EVALUATE_PROJECT');
			await assertProjectIsActive(ctx.db, input.projectId);

			return ctx.db.project.update({
				where: { id: input.projectId },
				data: {
					portfolioFeedback: input.feedback,
					portfolioEvaluatedAt: new Date(),
					portfolioEvaluatedById: ctx.session.userId
				},
				select: {
					portfolioFeedback: true,
					portfolioEvaluatedAt: true,
					portfolioEvaluatedBy: { select: { name: true } }
				}
			});
		}),

	updateProject: protectedProcedure
		.input(updateProjectSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await assertProjectPermission(ctx, id, 'EDIT_SETTINGS');

			const project = await ctx.db.project.findUnique({
				where: { id },
				select: { canceledAt: true }
			});
			if (project?.canceledAt) {
				throw canceledProjectError();
			}

			return ctx.db.project.update({
				where: { id },
				data,
				select: {
					id: true,
					title: true,
					description: true,
					methodology: true
				}
			});
		}),

	cancelProject: adminProcedure
		.input(
			z.object({
				projectId: z.string(),
				refundCredits: z.boolean().default(true),
				reason: z.string().trim().min(1).max(500)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db.$transaction(async (prisma) => {
				const project = await prisma.project.findUnique({
					where: { id: input.projectId },
					select: {
						id: true,
						title: true,
						canceledAt: true,
						memberships: {
							where: { status: 'ACTIVE' },
							select: { userId: true }
						},
						invitations: {
							where: { status: 'PENDING' },
							select: { id: true, userId: true }
						}
					}
				});

				if (!project) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Project not found'
					});
				}
				if (project.canceledAt) {
					throw canceledProjectError();
				}

				const memberIds = project.memberships.map(({ userId }) => userId);
				const [paymentEvidences, legacyPaymentEvidences] = input.refundCredits
					? await Promise.all([
							prisma.projectCreditPaymentEvidence.findMany({
								where: {
									projectId: project.id,
									userId: { in: memberIds },
									credits: { gt: 0 },
									memberRemovalAudit: null
								},
								select: {
									id: true,
									userId: true,
									credits: true,
									creditTransactionId: true
								}
							}),
							prisma.projectInvitation.findMany({
								where: {
									projectId: project.id,
									userId: { in: memberIds },
									status: 'ACCEPTED',
									creditCostSnapshot: { gt: 0 },
									memberRemovalAudit: null,
									creditPaymentEvidence: null
								},
								select: { id: true, userId: true, creditCostSnapshot: true }
							})
						])
					: [[], []];

				const refundsByUserId = new Map<string, number>();
				for (const evidence of paymentEvidences) {
					refundsByUserId.set(
						evidence.userId,
						(refundsByUserId.get(evidence.userId) ?? 0) + evidence.credits
					);
				}
				for (const invitation of legacyPaymentEvidences) {
					refundsByUserId.set(
						invitation.userId,
						(refundsByUserId.get(invitation.userId) ?? 0) +
							(invitation.creditCostSnapshot ?? 0)
					);
				}

				let refundedCredits = 0;
				for (const evidence of paymentEvidences) {
					await applyCreditTransaction(prisma, {
						userId: evidence.userId,
						type: 'REFUND',
						value: evidence.credits,
						source: 'PROJECT_CANCELLATION',
						externalReference: evidence.id,
						idempotencyKey: `refund:project-cancellation:evidence:${evidence.id}`,
						reversalOfId: evidence.creditTransactionId ?? undefined
					});
					refundedCredits += evidence.credits;
				}
				for (const invitation of legacyPaymentEvidences) {
					const credits = invitation.creditCostSnapshot ?? 0;
					await applyCreditTransaction(prisma, {
						userId: invitation.userId,
						type: 'REFUND',
						value: credits,
						source: 'PROJECT_CANCELLATION',
						externalReference: invitation.id,
						idempotencyKey: `refund:project-cancellation:invitation:${invitation.id}`
					});
					refundedCredits += credits;
				}

				if (project.invitations.length > 0) {
					await prisma.projectInvitation.updateMany({
						where: { projectId: project.id, status: 'PENDING' },
						data: { status: 'CANCELED', canceledAt: new Date() }
					});
				}

				await prisma.project.update({
					where: { id: project.id },
					data: {
						canceledAt: new Date(),
						canceledById: ctx.session.userId,
						cancellationReason: input.reason,
						refundCreditsOnCancellation: input.refundCredits,
						refundedCreditsOnCancellation: refundedCredits
					}
				});

				return {
					project,
					reason: input.reason,
					refundedCredits,
					refundsByUserId: [...refundsByUserId.entries()].map(
						([userId, credits]) => ({ userId, credits })
					),
					memberUserIds: memberIds,
					pendingInviteeUserIds: project.invitations.map(
						(invitation) => invitation.userId
					)
				};
			});

			const refundedCreditsByUserId = new Map(
				result.refundsByUserId.map((refund) => [refund.userId, refund.credits])
			);

			await Promise.all([
				...result.memberUserIds.map((userId) => {
					const refundedCredits = refundedCreditsByUserId.get(userId) ?? 0;
					return createNotification({
						db: ctx.db,
						userId,
						type: 'PROJECT_CANCELED',
						title: 'Project canceled',
						message: refundedCredits
							? `${result.project.title} was canceled. ${refundedCredits} credits were refunded. Reason: ${result.reason}`
							: `${result.project.title} was canceled. Reason: ${result.reason}`,
						link: `/workspace/${result.project.id}`
					});
				}),
				...result.pendingInviteeUserIds.map((userId) =>
					createNotification({
						db: ctx.db,
						userId,
						type: 'PROJECT_INVITATION_CANCELED',
						title: 'Project invitation canceled',
						message: `Your invitation to ${result.project.title} was canceled because the project was canceled. Reason: ${result.reason}`,
						link: '/my-projects'
					})
				)
			]);

			return {
				success: true,
				refundedCredits: result.refundedCredits,
				membersNotified: result.memberUserIds.length,
				invitationsCanceled: result.pendingInviteeUserIds.length
			};
		}),

	addProjectMember: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				userId: z.string(),
				role: z.nativeEnum(ProjectRoleEnum).default(ProjectRoleEnum.LEARNER),
				creditCost: z.number().int().positive().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_MEMBERS');
			if (input.role === ProjectRoleEnum.OWNER) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'A project can only have one owner'
				});
			}

			const result = await ctx.db.$transaction(async (prisma) => {
				const [project, user] = await Promise.all([
					prisma.project.findUnique({
						where: { id: input.projectId },
						select: {
							id: true,
							title: true,
							accessType: true,
							creditCost: true,
							canceledAt: true,
							maxParticipants: true,
							memberships: {
								select: { userId: true, status: true }
							}
						}
					}),
					prisma.user.findUnique({
						where: { id: input.userId },
						select: {
							id: true,
							email: true,
							name: true,
							mentorshipStatus: true
						}
					})
				]);

				if (!project) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Project not found'
					});
				}
				if (!user) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
				}
				if (project.canceledAt) {
					throw canceledProjectError();
				}
				if (
					project.memberships.some(
						(membership) =>
							membership.userId === user.id && membership.status === 'ACTIVE'
					)
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'User is already a project member'
					});
				}

				const memberCountAfterAdd =
					project.memberships.filter(
						(membership) => membership.status === 'ACTIVE'
					).length + 1;
				const overMaxParticipants =
					memberCountAfterAdd > project.maxParticipants;

				if (project.accessType === 'MENTORSHIP') {
					if (user.mentorshipStatus !== 'ACTIVE') {
						throw new TRPCError({
							code: 'FORBIDDEN',
							message: 'User does not have an active mentorship'
						});
					}
				}

				if (project.accessType === 'CREDITS') {
					const pendingInvite = await prisma.projectInvitation.findFirst({
						where: {
							projectId: project.id,
							userId: user.id,
							status: 'PENDING'
						},
						select: { id: true }
					});
					if (pendingInvite) {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'User already has a pending invitation'
						});
					}

					const creditCostSnapshot = project.creditCost ?? input.creditCost;
					if (!creditCostSnapshot || creditCostSnapshot <= 0) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message:
								'Credit project invitations require a positive credit cost'
						});
					}

					const invitation = await prisma.projectInvitation.create({
						data: {
							projectId: project.id,
							userId: user.id,
							invitedById: ctx.session.userId,
							creditCostSnapshot,
							role: input.role
						},
						select: { id: true }
					});

					return {
						kind: 'invited' as const,
						project,
						user,
						invitationId: invitation.id,
						overMaxParticipants
					};
				}

				await prisma.projectMembership.upsert({
					where: {
						projectId_userId: { projectId: project.id, userId: user.id }
					},
					create: {
						projectId: project.id,
						userId: user.id,
						role: input.role
					},
					update: { role: input.role, status: 'ACTIVE', joinedAt: new Date() }
				});

				return {
					kind: 'added' as const,
					project,
					user,
					overMaxParticipants
				};
			});

			if (result.kind === 'invited') {
				await createNotification({
					db: ctx.db,
					userId: result.user.id,
					type: 'PROJECT_INVITATION_RECEIVED',
					title: 'Project invitation',
					message: `You were invited to join ${result.project.title}. Review the invitation before credits are deducted.`,
					link: `/project-invitations/${result.invitationId}`
				});
			} else {
				await createNotification({
					db: ctx.db,
					userId: result.user.id,
					type: 'PROJECT_MEMBER_ADDED',
					title: 'Added to project',
					message: `You were added to ${result.project.title}.`,
					link: `/workspace/${result.project.id}`
				});
			}

			return result;
		}),

	transferProjectOwnership: protectedProcedure
		.input(z.object({ projectId: z.string(), userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_MEMBERS');
			return ctx.db.$transaction(async (prisma) => {
				const target = await prisma.projectMembership.findUnique({
					where: {
						projectId_userId: {
							projectId: input.projectId,
							userId: input.userId
						}
					},
					select: { role: true, status: true }
				});
				if (!target || target.status !== 'ACTIVE') {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'User is not an active project member'
					});
				}
				if (target.role === ProjectRoleEnum.OWNER) {
					return { success: true as const };
				}
				await prisma.projectMembership.updateMany({
					where: {
						projectId: input.projectId,
						role: ProjectRoleEnum.OWNER,
						status: 'ACTIVE'
					},
					data: { role: ProjectRoleEnum.MENTOR }
				});
				await prisma.projectMembership.update({
					where: {
						projectId_userId: {
							projectId: input.projectId,
							userId: input.userId
						}
					},
					data: { role: ProjectRoleEnum.OWNER }
				});
				return { success: true as const };
			});
		}),

	removeProjectMember: protectedProcedure
		.input(
			z.object({
				projectId: z.string(),
				userId: z.string(),
				refundCredits: z.boolean().default(false),
				reason: z.string().trim().max(500).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_MEMBERS');
			const result = await ctx.db.$transaction(async (prisma) => {
				const project = await prisma.project.findUnique({
					where: { id: input.projectId },
					select: {
						id: true,
						title: true,
						canceledAt: true,
						memberships: {
							where: { status: 'ACTIVE' },
							select: {
								role: true,
								user: { select: { id: true, email: true, name: true } }
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

				if (project.canceledAt) {
					throw canceledProjectError();
				}

				const membership = project.memberships.find(
					({ user }) => user.id === input.userId
				);
				const member = membership?.user;
				if (!member || !membership) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'User is not a project member'
					});
				}
				if (membership.role === ProjectRoleEnum.OWNER) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Transfer project ownership before removing the owner'
					});
				}

				const paymentEvidence =
					await prisma.projectCreditPaymentEvidence.findFirst({
						where: {
							projectId: project.id,
							userId: member.id,
							credits: { gt: 0 },
							memberRemovalAudit: null
						},
						select: { id: true, credits: true, creditTransactionId: true },
						orderBy: { createdAt: 'desc' }
					});

				const legacyPaymentEvidence = paymentEvidence
					? null
					: await prisma.projectInvitation.findFirst({
							where: {
								projectId: project.id,
								userId: member.id,
								status: 'ACCEPTED',
								creditCostSnapshot: { gt: 0 },
								memberRemovalAudit: null,
								creditPaymentEvidence: null
							},
							select: { id: true, creditCostSnapshot: true },
							orderBy: { respondedAt: 'desc' }
						});

				const refundReference =
					paymentEvidence?.id ?? legacyPaymentEvidence?.id ?? null;
				const refundableCredits =
					paymentEvidence?.credits ??
					legacyPaymentEvidence?.creditCostSnapshot ??
					0;
				const refundEligible =
					refundableCredits > 0 && refundReference !== null;

				if (input.refundCredits && !refundEligible) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No refundable credit payment evidence for this member'
					});
				}

				const assignedTasks = await prisma.task.findMany({
					where: {
						projectId: project.id,
						assignees: { some: { id: member.id } }
					},
					select: { id: true }
				});

				if (assignedTasks.length > 0) {
					await prisma.user.update({
						where: { id: member.id },
						data: {
							tasks: {
								disconnect: assignedTasks.map((task) => ({ id: task.id }))
							}
						}
					});
				}

				const unassignedTasks = { count: assignedTasks.length };

				await prisma.projectMembership.update({
					where: {
						projectId_userId: { projectId: project.id, userId: member.id }
					},
					data: { status: 'INACTIVE' }
				});

				if (input.refundCredits) {
					if (!refundReference) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: 'No refundable credit payment evidence for this member'
						});
					}
					await applyCreditTransaction(prisma, {
						userId: member.id,
						type: 'REFUND',
						value: refundableCredits,
						source: 'PROJECT_MEMBER_REMOVAL',
						externalReference: refundReference,
						idempotencyKey: `refund:member-removal:${refundReference}`,
						reversalOfId: paymentEvidence?.creditTransactionId ?? undefined
					});
				}

				const audit = await prisma.projectMemberRemovalAudit.create({
					data: {
						projectId: project.id,
						projectTitleSnapshot: project.title,
						userId: member.id,
						userEmailSnapshot: member.email,
						removedById: ctx.session.userId,
						reason: input.reason || null,
						memberCountBefore: project.memberships.length,
						wasLastMember: project.memberships.length === 1,
						wasSelfRemoval: member.id === ctx.session.userId,
						tasksUnassigned: unassignedTasks.count,
						refundEligible,
						refundRequested: input.refundCredits,
						refundStatus: input.refundCredits
							? 'REFUNDED'
							: refundEligible
								? 'NOT_REQUESTED'
								: 'NOT_APPLICABLE',
						refundedCredits: input.refundCredits ? refundableCredits : null,
						paymentEvidenceId: paymentEvidence?.id ?? null,
						legacyPaymentEvidenceInvitationId: legacyPaymentEvidence?.id ?? null
					},
					select: { id: true }
				});

				return {
					auditId: audit.id,
					project,
					member,
					reason: input.reason || null,
					refundedCredits: input.refundCredits ? refundableCredits : 0,
					tasksUnassigned: unassignedTasks.count,
					wasLastMember: project.memberships.length === 1,
					wasSelfRemoval: member.id === ctx.session.userId
				};
			});

			const reasonText = result.reason ? ` Reason: ${result.reason}` : '';
			await createNotification({
				db: ctx.db,
				userId: result.member.id,
				type: 'PROJECT_MEMBER_REMOVED',
				title: 'Removed from project',
				message: result.refundedCredits
					? `You were removed from ${result.project.title}. ${result.refundedCredits} credits were refunded.${reasonText}`
					: `You were removed from ${result.project.title}.${reasonText}`,
				link: '/my-projects'
			});

			return result;
		}),

	cancelProjectInvitation: adminProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existingInvitation = await ctx.db.projectInvitation.findUnique({
				where: { id: input.invitationId },
				select: { project: { select: { canceledAt: true } } }
			});
			if (existingInvitation?.project.canceledAt) {
				throw canceledProjectError();
			}

			const invitation = await ctx.db.projectInvitation.update({
				where: { id: input.invitationId, status: 'PENDING' },
				data: { status: 'CANCELED', canceledAt: new Date() },
				select: {
					userId: true,
					project: { select: { title: true } }
				}
			});

			await createNotification({
				db: ctx.db,
				userId: invitation.userId,
				type: 'PROJECT_INVITATION_CANCELED',
				title: 'Project invitation canceled',
				message: `Your invitation to ${invitation.project.title} was canceled.`,
				link: '/my-projects'
			});

			return { success: true };
		}),

	acceptProjectInvitation: protectedProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db.$transaction(async (prisma) => {
				const invitation = await prisma.projectInvitation.findFirst({
					where: {
						id: input.invitationId,
						userId: ctx.session.userId
					},
					select: {
						id: true,
						status: true,
						creditCostSnapshot: true,
						role: true,
						projectId: true,
						project: {
							select: {
								id: true,
								title: true,
								canceledAt: true
							}
						}
					}
				});

				if (!invitation || invitation.status !== 'PENDING') {
					if (invitation?.status === 'ACCEPTED') {
						return {
							accepted: true as const,
							projectId: invitation.projectId,
							projectTitle: invitation.project.title
						};
					}
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Pending invitation not found'
					});
				}

				if (invitation.project.canceledAt) {
					throw canceledProjectError();
				}

				const creditCost = invitation.creditCostSnapshot ?? 0;
				if (creditCost > 0) {
					const transaction = await applyCreditTransaction(prisma, {
						userId: ctx.session.userId,
						type: 'CONSUMPTION',
						value: -creditCost,
						source: 'PROJECT_INVITATION_ACCEPTANCE',
						externalReference: invitation.id,
						idempotencyKey: `project:invitation:${invitation.id}`
					});

					if (transaction.applied) {
						await prisma.projectCreditPaymentEvidence.create({
							data: {
								projectId: invitation.projectId,
								userId: ctx.session.userId,
								credits: creditCost,
								source: 'PROJECT_INVITATION_ACCEPTANCE',
								projectInvitationId: invitation.id,
								creditTransactionId: transaction.transactionId
							}
						});
					}
				}

				await prisma.projectMembership.upsert({
					where: {
						projectId_userId: {
							projectId: invitation.projectId,
							userId: ctx.session.userId
						}
					},
					create: {
						projectId: invitation.projectId,
						userId: ctx.session.userId,
						role: invitation.role
					},
					update: {
						role: invitation.role,
						status: 'ACTIVE',
						joinedAt: new Date()
					}
				});

				await prisma.projectInvitation.update({
					where: { id: invitation.id },
					data: { status: 'ACCEPTED', respondedAt: new Date() }
				});

				return {
					accepted: true as const,
					projectId: invitation.projectId,
					projectTitle: invitation.project.title
				};
			});

			if (result.accepted) {
				await createNotification({
					db: ctx.db,
					userId: ctx.session.userId,
					type: 'PROJECT_INVITATION_ACCEPTED',
					title: 'Project invitation accepted',
					message: `You joined ${result.projectTitle}.`,
					link: `/workspace/${result.projectId}`
				});
			}

			return result;
		}),

	declineProjectInvitation: protectedProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const invitation = await ctx.db.projectInvitation.update({
				where: {
					id: input.invitationId,
					userId: ctx.session.userId,
					status: 'PENDING'
				},
				data: { status: 'DECLINED', respondedAt: new Date() },
				select: { project: { select: { title: true } } }
			});

			await createNotification({
				db: ctx.db,
				userId: ctx.session.userId,
				type: 'PROJECT_INVITATION_DECLINED',
				title: 'Project invitation declined',
				message: `You declined ${invitation.project.title}.`,
				link: '/my-projects'
			});

			return { success: true };
		})
};
