import { TRPCError } from '@trpc/server';
import slugify from 'slugify';
import { createProjectSchema } from '~/features/projects/schemas/projects.schema';
import { protectedProcedure } from '~/server/api/trpc';

export const projectMutations = {
	createProject: protectedProcedure
		.input(createProjectSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { userId } = ctx.session;

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
							figmaProjectUrl: projectTemplate.figmaProjectUrl,
							categoryId: projectTemplate.categoryId,
							slug: slugify(projectTemplate.title),
							members: { connect: { id: user.id } }
						}
					});

					const sprintIdMap: Record<string, string> = {};
					for (const sprint of templateSprints) {
						const { id: oldId, projectTemplateSlug, ...sprintData } = sprint;
						const newSprint = await prisma.sprint.create({
							data: {
								...sprintData,
								projectSlug: newProject.slug,
								projectTemplateSlug: null
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
								projectTemplateId: null
							}
						});
					}

					return newProject;
				});

				return project.slug;
			} catch (error) {
				console.error('Create project error:', error);
				throw error;
			}
		})
};
