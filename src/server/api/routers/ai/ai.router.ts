import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../../trpc';
import { generateTaskDescription } from './services/ai.service';

export const aiRouter = createTRPCRouter({
	generateTaskDescription: adminProcedure
		.input(
			z.object({
				projectId: z.string(),
				taskDescription: z.string(),
				isTemplate: z.boolean()
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { projectId, taskDescription, isTemplate } = input;
				const project = isTemplate
					? await ctx.db.projectTemplate.findUnique({
							where: {
								id: projectId
							},
							select: {
								description: true,
								title: true
							}
						})
					: await ctx.db.project.findUnique({
							where: {
								id: projectId
							},
							select: {
								description: true,
								title: true
							}
						});

				if (!project) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: isTemplate
							? 'Project template not found'
							: 'Project not found'
					});
				}

				const projectInfo = `${project.title} - ${project.description}`;

				const newTaskDescription = await generateTaskDescription({
					oldDescription: taskDescription,
					projectInfo: projectInfo
				});

				return newTaskDescription;
			} catch (error) {
				console.error(error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate task description'
				});
			}
		})
});
