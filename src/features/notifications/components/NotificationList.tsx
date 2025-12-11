'use client';

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Bell } from 'lucide-react';
import type { RouterOutputs } from '~/trpc/react';
import { NotificationItem } from './NotificationItem';

dayjs.extend(isSameOrAfter);

type Notification =
	RouterOutputs['notification']['getNotifications']['notifications'][number];

interface NotificationListProps {
	notifications: Notification[];
	onNotificationClick: (notification: Notification) => void;
	onDelete: (notificationId: string) => void;
}

function groupNotificationsByDate(notifications: Notification[]): {
	today: Notification[];
	yesterday: Notification[];
	thisWeek: Notification[];
	older: Notification[];
} {
	const now = dayjs();
	const today = now.startOf('day');
	const yesterday = today.subtract(1, 'day');
	const thisWeek = today.subtract(7, 'days');

	const groups = {
		today: [] as Notification[],
		yesterday: [] as Notification[],
		thisWeek: [] as Notification[],
		older: [] as Notification[]
	};

	for (const notification of notifications) {
		const notificationDate = dayjs(notification.createdAt);

		if (notificationDate.isSameOrAfter(today)) {
			groups.today.push(notification);
		} else if (notificationDate.isSameOrAfter(yesterday)) {
			groups.yesterday.push(notification);
		} else if (notificationDate.isSameOrAfter(thisWeek)) {
			groups.thisWeek.push(notification);
		} else {
			groups.older.push(notification);
		}
	}

	return groups;
}

export function NotificationList({
	notifications,
	onNotificationClick,
	onDelete
}: NotificationListProps) {
	if (notifications.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<Bell className="mb-2 h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground text-sm">No notifications</p>
			</div>
		);
	}

	const grouped = groupNotificationsByDate(notifications);

	return (
		<div className="max-h-[400px] overflow-y-auto">
			{grouped.today.length > 0 && (
				<div className="mb-4">
					<h3 className="mb-2 px-2 font-semibold text-muted-foreground text-xs">
						Today
					</h3>
					{grouped.today.map((notification) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
							onClick={onNotificationClick}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}

			{grouped.yesterday.length > 0 && (
				<div className="mb-4">
					<h3 className="mb-2 px-2 font-semibold text-muted-foreground text-xs">
						Yesterday
					</h3>
					{grouped.yesterday.map((notification) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
							onClick={onNotificationClick}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}

			{grouped.thisWeek.length > 0 && (
				<div className="mb-4">
					<h3 className="mb-2 px-2 font-semibold text-muted-foreground text-xs">
						This Week
					</h3>
					{grouped.thisWeek.map((notification) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
							onClick={onNotificationClick}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}

			{grouped.older.length > 0 && (
				<div className="mb-4">
					<h3 className="mb-2 px-2 font-semibold text-muted-foreground text-xs">
						Older
					</h3>
					{grouped.older.map((notification) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
							onClick={onNotificationClick}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
}
