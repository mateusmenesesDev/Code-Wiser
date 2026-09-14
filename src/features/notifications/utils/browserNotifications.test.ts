import { describe, expect, it } from 'vitest';
import {
	getNewBrowserNotifications,
	MAX_BROWSER_NOTIFICATIONS_PER_UPDATE,
	MAX_REMEMBERED_NOTIFICATION_IDS,
	rememberNotificationIds,
	type BrowserNotificationItem
} from './browserNotifications';

const notification = (
	id: string,
	read = false
): BrowserNotificationItem => ({
	id,
	title: id,
	message: `Message ${id}`,
	read,
	link: null
});

describe('browser notification selection', () => {
	it('ignores read and already-seen notifications', () => {
		const knownIds = new Set(['seen']);

		expect(
			getNewBrowserNotifications(
				[notification('seen'), notification('read', true), notification('new')],
				knownIds
			)
		).toEqual([notification('new')]);
	});

	it('limits a refresh to avoid flooding the desktop', () => {
		const notifications = Array.from({ length: 5 }, (_, index) =>
			notification(`new-${index}`)
		);

		expect(
			getNewBrowserNotifications(notifications, new Set())
		).toHaveLength(MAX_BROWSER_NOTIFICATIONS_PER_UPDATE);
	});

	it('bounds remembered ids', () => {
		const notifications = Array.from(
			{ length: MAX_REMEMBERED_NOTIFICATION_IDS + 1 },
			(_, index) => notification(`notification-${index}`)
		);

		const rememberedIds = rememberNotificationIds(new Set(), notifications);

		expect(rememberedIds.size).toBe(MAX_REMEMBERED_NOTIFICATION_IDS);
		expect(rememberedIds.has('notification-0')).toBe(false);
		expect(rememberedIds.has(`notification-${MAX_REMEMBERED_NOTIFICATION_IDS}`)).toBe(
			true
		);
	});
});
