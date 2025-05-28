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
			console.log('columns', columns);
			return columns;
		})
};
