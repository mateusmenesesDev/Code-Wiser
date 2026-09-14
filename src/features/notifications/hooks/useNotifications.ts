import { api } from '~/trpc/react';
import { useBrowserNotifications } from './useBrowserNotifications';

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useNotifications() {
	const utils = api.useUtils();

	const { data: notificationsData, isLoading: isLoadingNotifications } =
		api.notification.getNotifications.useQuery(
			{ limit: 50 },
			{
				refetchInterval: POLLING_INTERVAL,
				staleTime: POLLING_INTERVAL
			}
		);

	const { data: unreadCountData, isLoading: isLoadingUnreadCount } =
		api.notification.getUnreadCount.useQuery(undefined, {
			refetchInterval: POLLING_INTERVAL,
			staleTime: POLLING_INTERVAL
		});

	const markAsReadMutation = api.notification.markAsRead.useMutation({
		onSuccess: () => {
			void utils.notification.getNotifications.invalidate();
			void utils.notification.getUnreadCount.invalidate();
		}
	});

	const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
		onSuccess: () => {
			void utils.notification.getNotifications.invalidate();
			void utils.notification.getUnreadCount.invalidate();
		}
	});

	const clearAllMutation = api.notification.clearAll.useMutation({
		onSuccess: () => {
			void utils.notification.getNotifications.invalidate();
			void utils.notification.getUnreadCount.invalidate();
		}
	});

	const deleteMutation = api.notification.delete.useMutation({
		onSuccess: () => {
			void utils.notification.getNotifications.invalidate();
			void utils.notification.getUnreadCount.invalidate();
		}
	});

	const markAsRead = (notificationId: string) => {
		markAsReadMutation.mutate({ notificationId });
	};

	const markAllAsRead = () => {
		markAllAsReadMutation.mutate();
	};

	const clearAll = () => {
		clearAllMutation.mutate();
	};

	const deleteNotification = (notificationId: string) => {
		deleteMutation.mutate({ notificationId });
	};

	const isLoading = isLoadingNotifications || isLoadingUnreadCount;
	const browserNotifications = useBrowserNotifications(
		notificationsData?.notifications ?? [],
		isLoading
	);

	return {
		notifications: notificationsData?.notifications ?? [],
		unreadCount: unreadCountData?.count ?? 0,
		isLoading,
		...browserNotifications,
		markAsRead,
		markAllAsRead,
		clearAll,
		deleteNotification,
		isMarkingAsRead: markAsReadMutation.isPending,
		isMarkingAllAsRead: markAllAsReadMutation.isPending,
		isClearingAll: clearAllMutation.isPending,
		isDeleting: deleteMutation.isPending
	};
}
