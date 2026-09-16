import { ProjectStatusEnum } from '@prisma/client';
import { z } from 'zod';
import { adminProcedure, publicProcedure } from '~/server/api/trpc';
import {
	approvedCatalogInclude,
	approvedCatalogInputSchema,
	getApprovedCatalogOrderBy,
	keepLatestTemplateVersions,
	sortApprovedCatalog
} from './approvedCatalogQuery';

export const projectTemplateQueries = {
	getApproved: publicProcedure
		.input(approvedCatalogInputSchema)
		.query(async ({ ctx, input }) => {
			const sort = input?.sort ?? 'relevance';
			const approvedVersions = await ctx.db.projectTemplate.findMany({
				where: { status: 'APPROVED' },
				select: { id: true, templateKey: true, version: true }
			});
			const latestIds = keepLatestTemplateVersions(approvedVersions).map(
				({ id }) => id
			);
			if (latestIds.length === 0) return [];

			const projects = await ctx.db.projectTemplate.findMany({
				where: {
					id: { in: latestIds },
					status: 'APPROVED',
					...(input?.search
						? {
								OR: [
									{ title: { contains: input.search, mode: 'insensitive' } },
									{
										description: {
											contains: input.search,
											mode: 'insensitive'
										}
									}
								]
							}
						: {}),
					...(input?.category
						? {
								category: {
									name: { equals: input.category, mode: 'insensitive' }
								}
							}
						: {}),
					...(input?.technologies?.length
						? {
								technologies: {
									some: {
										OR: input.technologies.map((technology) => ({
											name: { equals: technology, mode: 'insensitive' as const }
										}))
									}
								}
							}
						: {}),
					...(input?.difficulty ? { difficulty: input.difficulty } : {}),
					...(input?.methodology ? { methodology: input.methodology } : {}),
					...(input?.accessType ? { accessType: input.accessType } : {})
				},
				orderBy: getApprovedCatalogOrderBy(sort),
				include: approvedCatalogInclude
			});

			return sortApprovedCatalog(projects, sort, input?.search);
		}),

	getFilterOptions: publicProcedure.query(async ({ ctx }) => {
		const approvedVersions = await ctx.db.projectTemplate.findMany({
			where: { status: 'APPROVED' },
			select: {
				templateKey: true,
				version: true,
				category: { select: { name: true } },
				technologies: { select: { name: true } }
			}
		});
		const latestTemplates = keepLatestTemplateVersions(approvedVersions);

		return {
			categories: [
				...new Set(latestTemplates.map(({ category }) => category.name))
			].sort(),
			technologies: [
				...new Set(
					latestTemplates.flatMap((template) =>
						template.technologies.map(({ name }) => name)
					)
				)
			].sort()
		};
	}),

	getInfoById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const projectTemplate = await ctx.db.projectTemplate.findUnique({
					where: { id: input.id, status: 'APPROVED' },
					include: {
						technologies: true,
						category: true,
						learningOutcomes: true,
						milestones: true,
						epics: true,
						sprints: true,
						images: {
							orderBy: { order: 'asc' },
							select: { url: true, alt: true, id: true }
						}
					}
				});
				if (!projectTemplate) return null;

				const latest = await ctx.db.projectTemplate.findFirst({
					where: {
						templateKey: projectTemplate.templateKey,
						status: 'APPROVED'
					},
					orderBy: { version: 'desc' },
					select: { id: true }
				});
				return latest?.id === projectTemplate.id ? projectTemplate : null;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}),

	getAll: adminProcedure
		.input(z.object({ status: z.nativeEnum(ProjectStatusEnum) }).optional())
		.query(({ ctx, input }) =>
			ctx.db.projectTemplate.findMany({
				where: { status: input?.status },
				orderBy: [
					{ sortOrder: 'asc' },
					{ templateKey: 'asc' },
					{ version: 'desc' }
				],
				include: {
					category: { select: { name: true } },
					technologies: true
				}
			})
		),

	getById: adminProcedure
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
							where: { parentTaskId: null },
							include: {
								assignees: { select: { id: true, name: true } },
								sprint: { select: { id: true, title: true } },
								epic: { select: { id: true, title: true } }
							},
							orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
						},
						epics: true,
						sprints: true,
						productVersions: true,
						images: {
							orderBy: { order: 'asc' },
							select: { url: true, alt: true }
						}
					}
				});

				return projectTemplate;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}),

	getImages: adminProcedure
		.input(z.object({ projectTemplateId: z.string() }))
		.query(async ({ ctx, input }) => {
			const projectTemplate = await ctx.db.projectTemplate.findUnique({
				where: { id: input.projectTemplateId },
				select: {
					images: {
						select: { url: true, alt: true, id: true, order: true },
						orderBy: { order: 'asc' }
					}
				}
			});

			return projectTemplate?.images;
		})
};
