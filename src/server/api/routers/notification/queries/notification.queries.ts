import { protectedProcedure } from '~/server/api/trpc';
import { getNotificationsSchema } from '../notification.schema';

export const notificationQueries = {
	getNotifications: protectedProcedure
		.input(getNotificationsSchema)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 50;
			const cursor = input?.cursor;
			const userId = ctx.session.userId;

			const notifications = await ctx.db.notification.findMany({
				where: {
					userId
				},
				take: limit + 1,
				...(cursor && {
					cursor: {
						id: cursor
					},
					skip: 1
				}),
				orderBy: {
					createdAt: 'desc'
				}
			});

			let nextCursor: string | undefined = undefined;
			if (notifications.length > limit) {
				const nextItem = notifications.pop();
				nextCursor = nextItem?.id;
			}

			return {
				notifications,
				nextCursor
			};
		}),

	getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.userId;

		const count = await ctx.db.notification.count({
			where: {
				userId,
				read: false
			}
		});

		return { count };
	})
};
