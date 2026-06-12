import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createProjectSchema,
	updateProjectSchema
} from '~/features/projects/schemas/projects.schema';
import { generatePublicCode } from '~/lib/publicTaskId';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { createNotification } from '~/server/services/notification/base';
import { userHasAccessToProject } from '~/server/utils/auth';
import { userHasAccess } from '../utils/userHasAccess';

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
							tasks: true
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

				if (!userHasAccess(user, projectTemplate)) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'User does not have access to this project template'
					});
				}

				const userHasProject = await ctx.db.project.findFirst({
					where: {
						title: projectTemplate.title,
						members: {
							some: {
								id: user.id
							}
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
								figmaProjectUrl: projectTemplate.figmaProjectUrl,
								publicCode: await makeUniqueProjectPublicCode(
									prisma,
									projectTemplate.publicCode,
									projectTemplate.title
								),
								nextTaskNumber: projectTemplate.nextTaskNumber,
								categoryId: projectTemplate.categoryId,
								members: { connect: { id: user.id } }
							}
						});

						const sprintIdMap: Record<string, string> = {};
						if (templateSprints.length > 0) {
							await prisma.sprint.createMany({
								data: templateSprints.map((sprint) => {
									const {
										id: oldId,
										projectTemplateId,
										...sprintData
									} = sprint;
									const newId = randomUUID();
									sprintIdMap[oldId] = newId;

									return {
										...sprintData,
										id: newId,
										projectId: newProject.id,
										projectTemplateId: null
									};
								})
							});
						}

						const epicIdMap: Record<string, string> = {};
						if (templateEpics.length > 0) {
							await prisma.epic.createMany({
								data: templateEpics.map((epic) => {
									const { id: oldId, projectTemplateId, ...epicData } = epic;
									const newId = randomUUID();
									epicIdMap[oldId] = newId;

									return {
										...epicData,
										id: newId,
										projectId: newProject.id,
										projectTemplateId: null
									};
								})
							});
						}

						if (templateTasks.length > 0) {
							await prisma.task.createMany({
								data: templateTasks.map((task) => {
									const {
										id: _taskId,
										epicId,
										sprintId,
										projectTemplateId,
										...taskData
									} = task;

									return {
										...taskData,
										projectId: newProject.id,
										epicId: epicId ? epicIdMap[epicId] : null,
										sprintId: sprintId ? sprintIdMap[sprintId] : null,
										projectTemplateId: null,
										assigneeId: user.id
									};
								})
							});
						}

						if (
							user.mentorshipStatus !== 'ACTIVE' &&
							projectTemplate.accessType === 'CREDITS'
						) {
							const credits = projectTemplate.credits ?? 0;
							await prisma.user.update({
								where: { id: user.id },
								data: { credits: { decrement: credits } }
							});
							if (credits > 0) {
								await prisma.projectCreditPaymentEvidence.create({
									data: {
										projectId: newProject.id,
										userId: user.id,
										credits,
										source: 'PROJECT_CREATION'
									}
								});
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

	updateProject: protectedProcedure
		.input(updateProjectSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await userHasAccessToProject(ctx, id);

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
						members: { select: { id: true } },
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

				const memberIds = project.members.map((member) => member.id);
				const [paymentEvidences, legacyPaymentEvidences] = input.refundCredits
					? await Promise.all([
							prisma.projectCreditPaymentEvidence.findMany({
								where: {
									projectId: project.id,
									userId: { in: memberIds },
									credits: { gt: 0 },
									memberRemovalAudit: null
								},
								select: { id: true, userId: true, credits: true }
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
				for (const [userId, credits] of refundsByUserId) {
					await prisma.user.update({
						where: { id: userId },
						data: { credits: { increment: credits } }
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

	addProjectMember: adminProcedure
		.input(
			z.object({
				projectId: z.string(),
				userId: z.string(),
				creditCost: z.number().int().positive().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
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
							members: { select: { id: true } }
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
				if (project.members.some((member) => member.id === user.id)) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'User is already a project member'
					});
				}

				const memberCountAfterAdd = project.members.length + 1;
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
							creditCostSnapshot
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

				await prisma.project.update({
					where: { id: project.id },
					data: { members: { connect: { id: user.id } } }
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

	removeProjectMember: adminProcedure
		.input(
			z.object({
				projectId: z.string(),
				userId: z.string(),
				refundCredits: z.boolean().default(false),
				reason: z.string().trim().max(500).optional()
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
						members: { select: { id: true, email: true, name: true } }
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

				const member = project.members.find((user) => user.id === input.userId);
				if (!member) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'User is not a project member'
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
						select: { id: true, credits: true },
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

				const refundableCredits =
					paymentEvidence?.credits ??
					legacyPaymentEvidence?.creditCostSnapshot ??
					0;
				const refundEligible = refundableCredits > 0;

				if (input.refundCredits && !refundEligible) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No refundable credit payment evidence for this member'
					});
				}

				const unassignedTasks = await prisma.task.updateMany({
					where: { projectId: project.id, assigneeId: member.id },
					data: { assigneeId: null }
				});

				await prisma.project.update({
					where: { id: project.id },
					data: { members: { disconnect: { id: member.id } } }
				});

				if (input.refundCredits) {
					await prisma.user.update({
						where: { id: member.id },
						data: { credits: { increment: refundableCredits } }
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
						memberCountBefore: project.members.length,
						wasLastMember: project.members.length === 1,
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
					wasLastMember: project.members.length === 1,
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
						userId: ctx.session.userId,
						status: 'PENDING'
					},
					select: {
						id: true,
						creditCostSnapshot: true,
						projectId: true,
						project: {
							select: {
								id: true,
								title: true,
								canceledAt: true,
								members: { select: { id: true } }
							}
						}
					}
				});

				if (!invitation) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Pending invitation not found'
					});
				}

				if (invitation.project.canceledAt) {
					throw canceledProjectError();
				}

				const creditCost = invitation.creditCostSnapshot ?? 0;
				const creditUpdate = await prisma.user.updateMany({
					where: { id: ctx.session.userId, credits: { gte: creditCost } },
					data: { credits: { decrement: creditCost } }
				});

				if (creditUpdate.count !== 1) {
					return {
						accepted: false as const,
						projectTitle: invitation.project.title
					};
				}

				if (creditCost > 0) {
					await prisma.projectCreditPaymentEvidence.create({
						data: {
							projectId: invitation.projectId,
							userId: ctx.session.userId,
							credits: creditCost,
							source: 'PROJECT_INVITATION_ACCEPTANCE',
							projectInvitationId: invitation.id
						}
					});
				}

				if (
					!invitation.project.members.some(
						(member) => member.id === ctx.session.userId
					)
				) {
					await prisma.project.update({
						where: { id: invitation.projectId },
						data: { members: { connect: { id: ctx.session.userId } } }
					});
				}

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
