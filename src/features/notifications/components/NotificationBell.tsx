'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { Badge } from '~/common/components/ui/badge';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from './NotificationList';
import type { RouterOutputs } from '~/trpc/react';

type Notification =
	RouterOutputs['notification']['getNotifications']['notifications'][number];

export function NotificationBell() {
	const router = useRouter();
	const {
		notifications,
		unreadCount,
		isLoading,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		isMarkingAllAsRead
	} = useNotifications();

	const handleNotificationClick = (notification: Notification) => {
		markAsRead(notification.id);

		if (notification.link) {
			const url = new URL(notification.link);
			router.push(url.pathname + url.search);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="-right-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<div className="flex items-center justify-between px-3 py-2">
					<h2 className="font-semibold">Notifications</h2>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={markAllAsRead}
							disabled={isMarkingAllAsRead}
							className="h-7 text-xs"
						>
							Mark all as read
						</Button>
					)}
				</div>
				<DropdownMenuSeparator />
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<p className="text-muted-foreground text-sm">Loading...</p>
					</div>
				) : (
					<NotificationList
						notifications={notifications}
						onNotificationClick={handleNotificationClick}
						onDelete={deleteNotification}
					/>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
