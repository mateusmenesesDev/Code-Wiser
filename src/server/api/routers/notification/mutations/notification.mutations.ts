import { protectedProcedure } from '~/server/api/trpc';
import {
	deleteNotificationSchema,
	markAsReadSchema
} from '../notification.schema';

export const notificationMutations = {
	markAsRead: protectedProcedure
		.input(markAsReadSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;

			await ctx.db.notification.updateMany({
				where: {
					id: input.notificationId,
					userId
				},
				data: {
					read: true,
					readAt: new Date()
				}
			});

			return { success: true };
		}),

	markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.userId;

		await ctx.db.notification.updateMany({
			where: {
				userId,
				read: false
			},
			data: {
				read: true,
				readAt: new Date()
			}
		});

		return { success: true };
	}),

	delete: protectedProcedure
		.input(deleteNotificationSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;

			await ctx.db.notification.deleteMany({
				where: {
					id: input.notificationId,
					userId
				}
			});

			return { success: true };
		})
};
