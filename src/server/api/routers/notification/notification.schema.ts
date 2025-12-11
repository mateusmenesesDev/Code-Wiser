import { z } from 'zod';

export const getNotificationsSchema = z.object({
	limit: z.number().int().min(1).max(100).default(50),
	cursor: z.string().optional()
});

export const markAsReadSchema = z.object({
	notificationId: z.string()
});

export const deleteNotificationSchema = z.object({
	notificationId: z.string()
});
