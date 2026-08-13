import type { NotificationType, PrismaClient } from '@prisma/client';
import { getBaseUrl } from '~/server/utils/getBaseUrl';

interface CreateNotificationParams {
	db: PrismaClient;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
	dedupeKey?: string;
}

/**
 * Ensures that a link is always a complete URL (with protocol and domain).
 * If the link is already a complete URL, it's returned as-is.
 * If it's a relative path, it's converted to a complete URL using the base URL.
 */
function ensureCompleteUrl(link: string | undefined): string | undefined {
	if (!link) {
		return undefined;
	}

	// If it's already a complete URL (starts with http:// or https://), return as-is
	if (link.startsWith('http://') || link.startsWith('https://')) {
		return link;
	}

	// If it's a relative path, prepend the base URL
	const baseUrl = getBaseUrl();
	// Remove leading slash if present to avoid double slashes
	const cleanPath = link.startsWith('/') ? link : `/${link}`;
	return `${baseUrl}${cleanPath}`;
}

export async function createNotification(
	params: CreateNotificationParams
): Promise<void> {
	const { db, userId, type, title, message, link, dedupeKey } = params;

	await db.notification.create({
		data: {
			userId,
			type,
			title,
			message,
			link: ensureCompleteUrl(link),
			dedupeKey
		}
	});
}

export async function getAdminUsers(): Promise<
	Array<{ id: string; email: string; name: string | null }>
> {
	try {
		const { db } = await import('~/server/db');
		return await db.user.findMany({
			where: { isOrgAdmin: true },
			select: {
				id: true,
				email: true,
				name: true
			}
		});
	} catch (error) {
		console.error('Failed to get admin users:', error);
		return [];
	}
}
