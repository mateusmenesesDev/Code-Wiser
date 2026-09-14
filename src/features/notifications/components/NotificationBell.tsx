'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import type { RouterOutputs } from '~/trpc/react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from './NotificationList';

type Notification =
	RouterOutputs['notification']['getNotifications']['notifications'][number];

export function NotificationBell() {
	const router = useRouter();
	const t = useTranslations('notifications');
	const {
		notifications,
		unreadCount,
		isLoading,
		markAsRead,
		markAllAsRead,
		clearAll,
		deleteNotification,
		isMarkingAllAsRead,
		isClearingAll
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
				<div className="flex items-center justify-between gap-2 px-3 py-2">
					<h2 className="font-semibold">{t('title')}</h2>
					<div className="flex items-center gap-1">
						{unreadCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={markAllAsRead}
								disabled={isMarkingAllAsRead || isClearingAll}
								className="h-7 px-2 text-xs"
							>
								{t('markAllAsRead')}
							</Button>
						)}
						{notifications.length > 0 && (
							<ConfirmationDialog
								title={t('clearAllTitle')}
								description={t('clearAllDescription')}
								cancelLabel={t('cancel')}
								confirmLabel={t('confirmClearAll')}
								onConfirm={clearAll}
							>
								<Button
									variant="ghost"
									size="sm"
									disabled={isClearingAll || isMarkingAllAsRead}
									className="h-7 px-2 text-destructive text-xs hover:text-destructive"
								>
									{t('clearAll')}
								</Button>
							</ConfirmationDialog>
						)}
					</div>
				</div>
				<DropdownMenuSeparator />
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<p className="text-muted-foreground text-sm">{t('loading')}</p>
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
