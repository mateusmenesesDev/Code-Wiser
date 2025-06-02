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
					// Ensure the user exists in the database
					await prisma.user.upsert({
						where: { id: userId },
						update: {},
						create: {
							id: userId,
							email: `user-${userId}@temp.com`, // Temporary email, will be updated by webhook
							credits: 0
						}
					});

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

					const {
						id: _templateId,
						status: _status,
						expectedDuration: _expectedDuration,
						credits: _credits,
						sprints: templateSprints,
						epics: templateEpics,
						tasks: templateTasks,
						...projectData
					} = projectTemplate;

					const newProject = await prisma.project.create({
						data: {
							...projectData,
							slug: slugify(projectTemplate.title),
							members: { connect: { id: userId } }
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
