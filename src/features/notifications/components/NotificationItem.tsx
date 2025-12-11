import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { X } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';

dayjs.extend(relativeTime);

type Notification =
	RouterOutputs['notification']['getNotifications']['notifications'][number];

interface NotificationItemProps {
	notification: Notification;
	onClick: (notification: Notification) => void;
	onDelete: (notificationId: string) => void;
}

function formatNotificationDate(date: Date): string {
	return dayjs(date).fromNow();
}

export function NotificationItem({
	notification,
	onClick,
	onDelete
}: NotificationItemProps) {
	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete(notification.id);
	};

	return (
		<div
			className={cn(
				'group flex w-full items-start gap-2 px-3 py-2 transition-colors hover:bg-accent',
				!notification.read && 'bg-accent/50'
			)}
		>
			<button
				type="button"
				onClick={() => onClick(notification)}
				className="flex-1 text-left"
			>
				<div className="flex items-start gap-2">
					<div className="flex-1">
						<p
							className={cn(
								'font-medium text-sm',
								!notification.read && 'font-semibold'
							)}
						>
							{notification.title}
						</p>
						<p className="text-muted-foreground text-xs">
							{notification.message}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{formatNotificationDate(notification.createdAt)}
						</p>
					</div>
					{!notification.read && (
						<div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
					)}
				</div>
			</button>
			<Button
				variant="ghost"
				size="icon"
				className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
				onClick={handleDelete}
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}
