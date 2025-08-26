import { ProjectStatusEnum } from '@prisma/client';
import { z } from 'zod';
import {
	adminProcedure,
	protectedProcedure,
	publicProcedure
} from '~/server/api/trpc';

export const projectTemplateQueries = {
	getApproved: publicProcedure.query(({ ctx }) =>
		ctx.db.projectTemplate.findMany({
			where: { status: 'APPROVED' },
			include: {
				category: true,
				technologies: true,
				learningOutcomes: true,
				milestones: true,
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
				},
				images: {
					orderBy: {
						order: 'asc'
					},
					select: {
						url: true,
						alt: true
					}
				},
				epics: true,
				sprints: true
			}
		})
	),

	getInfoById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const projectTemplate = await ctx.db.projectTemplate.findUnique({
					where: {
						id: input.id,
						status: 'APPROVED'
					},
					include: {
						technologies: true,
						category: true,
						learningOutcomes: true,
						milestones: true,
						epics: true,
						sprints: true,
						images: {
							orderBy: {
								order: 'asc'
							},
							select: {
								url: true,
								alt: true,
								id: true
							}
						}
					}
				});

				return projectTemplate;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}),

	getAll: adminProcedure
		.input(z.object({ status: z.nativeEnum(ProjectStatusEnum) }).optional())
		.query(({ ctx, input }) =>
			ctx.db.projectTemplate.findMany({
				where: {
					status: input?.status
				},
				include: {
					category: {
						select: {
							name: true
						}
					},
					technologies: true
				}
			})
		),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const projectTemplate = await ctx.db.projectTemplate.findUnique({
					where: { id: input.id },
					include: {
						technologies: true,
						category: true,
						learningOutcomes: true,
						milestones: true,
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
						},
						epics: true,
						sprints: true,
						images: {
							orderBy: {
								order: 'asc'
							},
							select: {
								url: true,
								alt: true
							}
						}
					}
				});

				return projectTemplate;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}),

	getImages: protectedProcedure
		.input(z.object({ projectTemplateId: z.string() }))
		.query(async ({ ctx, input }) => {
			const projectTemplate = await ctx.db.projectTemplate.findUnique({
				where: { id: input.projectTemplateId },
				select: {
					images: {
						select: {
							url: true,
							alt: true,
							id: true
						},
						orderBy: {
							order: 'asc'
						}
					}
				}
			});

			return projectTemplate?.images;
		})
};
