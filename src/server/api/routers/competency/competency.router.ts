import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getCompetencyMatrix } from '~/server/services/competency/competencyMatrix';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

const matrixInput = z.object({ userId: z.string().min(1) }).optional();

export const competencyRouter = createTRPCRouter({
	getCatalog: protectedProcedure.query(({ ctx }) =>
		ctx.db.competency.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: 'asc' },
			select: { id: true, slug: true, name: true, description: true }
		})
	),

	getMatrix: protectedProcedure
		.input(matrixInput)
		.query(async ({ ctx, input }) => {
			const requestedUserId = input?.userId;
			const isViewingAnotherUser = Boolean(
				requestedUserId && requestedUserId !== ctx.session.userId
			);

			if (isViewingAnotherUser && !ctx.isAdmin) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'Only administrators can view another learner competency matrix'
				});
			}

			return getCompetencyMatrix(ctx.db, requestedUserId ?? ctx.session.userId);
		})
});
