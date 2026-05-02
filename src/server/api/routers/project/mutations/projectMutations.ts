import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	createProjectSchema,
	updateProjectSchema
} from '~/features/projects/schemas/projects.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { createNotification } from '~/server/services/notification/base';
import { userHasAccessToProject } from '~/server/utils/auth';
import { userHasAccess } from '../utils/userHasAccess';

export const projectMutations = {
	createProject: protectedProcedure
		.input(createProjectSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { userId } = ctx.session;
				console.log('userId', userId);

				const project = await ctx.db.$transaction(async (prisma) => {
					const user = await prisma.user.findUnique({
						where: { id: userId }
					});
					if (!user) {
						throw new TRPCError({
							code: 'NOT_FOUND',
							message: 'User not found'
						});
					}

					const projectTemplate = await prisma.projectTemplate.findUnique({
						where: {
							id: input.projectTemplateId
						},
						include: {
							sprints: true,
							epics: true,
							tasks: true
						}
					});

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

					const userHasProject = await prisma.project.findFirst({
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
							categoryId: projectTemplate.categoryId,
							members: { connect: { id: user.id } }
						}
					});

					const sprintIdMap: Record<string, string> = {};
					for (const sprint of templateSprints) {
						const { id: oldId, projectTemplateId, ...sprintData } = sprint;
						const newSprint = await prisma.sprint.create({
							data: {
								...sprintData,
								projectId: newProject.id,
								projectTemplateId: null
							}
						});
						sprintIdMap[oldId] = newSprint.id;
					}

					const epicIdMap: Record<string, string> = {};
					for (const epic of templateEpics) {
						const { id: oldId, projectTemplateId, ...epicData } = epic;
						const newEpic = await prisma.epic.create({
							data: {
								...epicData,
								projectId: newProject.id
							}
						});
						epicIdMap[oldId] = newEpic.id;
					}

					for (const task of templateTasks) {
						const {
							id: _taskId,
							epicId,
							sprintId,
							projectTemplateId,
							...taskData
						} = task;
						await prisma.task.create({
							data: {
								...taskData,
								projectId: newProject.id,
								epicId: epicId ? epicIdMap[epicId] : null,
								sprintId: sprintId ? sprintIdMap[sprintId] : null,
								projectTemplateId: null,
								assigneeId: user.id
							}
						});
					}

					if (
						user.mentorshipStatus !== 'ACTIVE' &&
						projectTemplate.accessType === 'CREDITS'
					) {
						await prisma.user.update({
							where: { id: user.id },
							data: { credits: { decrement: projectTemplate.credits ?? 0 } }
						});
					}

					return newProject;
				});

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

	cancelProjectInvitation: adminProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
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
