export const MAX_BROWSER_NOTIFICATIONS_PER_UPDATE = 3;
export const MAX_REMEMBERED_NOTIFICATION_IDS = 500;

export type BrowserNotificationItem = {
	id: string;
	title: string;
	message: string;
	read: boolean;
	link: string | null;
};

export function getNewBrowserNotifications(
	notifications: readonly BrowserNotificationItem[],
	knownIds: ReadonlySet<string>
) {
	return notifications
		.filter((notification) => !notification.read && !knownIds.has(notification.id))
	.slice(0, MAX_BROWSER_NOTIFICATIONS_PER_UPDATE);
}

export function rememberNotificationIds(
	knownIds: ReadonlySet<string>,
	notifications: readonly BrowserNotificationItem[]
) {
	const rememberedIds = new Set(knownIds);

	for (const notification of notifications) {
		rememberedIds.add(notification.id);
	}

	while (rememberedIds.size > MAX_REMEMBERED_NOTIFICATION_IDS) {
		const oldestId = rememberedIds.values().next().value;
		if (!oldestId) break;
		rememberedIds.delete(oldestId);
	}

	return rememberedIds;
}
