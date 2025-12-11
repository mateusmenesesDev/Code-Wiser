import type { NotificationType, PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

interface CreateNotificationParams {
	db: PrismaClient;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
}

export async function createNotification(
	params: CreateNotificationParams
): Promise<void> {
	const { db, userId, type, title, message, link } = params;

	await db.notification.create({
		data: {
			userId,
			type,
			title,
			message,
			link
		}
	});
}

export async function getAdminUsers(): Promise<
	Array<{ id: string; email: string; name: string | null }>
> {
	try {
		const { db } = await import('~/server/db');
		const allUsers = await db.user.findMany({
			select: {
				id: true,
				email: true,
				name: true
			}
		});

		const adminUsers: Array<{
			id: string;
			email: string;
			name: string | null;
		}> = [];

		await Promise.all(
			allUsers.map(async (user) => {
				try {
					const organizationMemberships =
						await clerkClient.users.getOrganizationMembershipList({
							userId: user.id
						});

					const isAdmin = organizationMemberships.data.some(
						(membership) => membership.role === 'org:admin'
					);

					if (isAdmin) {
						adminUsers.push(user);
					}
				} catch {
					// Skip users that can't be fetched from Clerk
				}
			})
		);

		return adminUsers;
	} catch (error) {
		console.error('Failed to get admin users:', error);
		return [];
	}
}
