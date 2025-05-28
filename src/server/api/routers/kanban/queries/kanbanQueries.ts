import { z } from 'zod';
import { protectedProcedure } from '~/server/api/trpc';

export const kanbanQueries = {
	getColumnsByProjectSlug: protectedProcedure
		.input(z.object({ projectSlug: z.string() }))
		.query(async ({ ctx, input }) => {
			const columns = await ctx.db.kanbanColumn.findMany({
				where: {
					project: { slug: input.projectSlug }
				},
				orderBy: { position: 'asc' },
				include: {
					tasks: {
						orderBy: { orderInColumn: 'asc' }
					}
				}
			});
			return columns;
		}),

	getColumnsByProjectTemplateSlug: protectedProcedure
		.input(z.object({ projectTemplateSlug: z.string() }))
		.query(async ({ ctx, input }) => {
			const columns = await ctx.db.kanbanColumn.findMany({
				where: {
					projectTemplate: { slug: input.projectTemplateSlug }
				},
				orderBy: { position: 'asc' },
				include: {
					tasks: {
						orderBy: { orderInColumn: 'asc' }
					}
				}
			});
			return columns;
		})
};
