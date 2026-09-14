'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RouterOutputs } from '~/trpc/react';
import {
	getNewBrowserNotifications,
	rememberNotificationIds
} from '../utils/browserNotifications';

type Notification =
	RouterOutputs['notification']['getNotifications']['notifications'][number];

export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

function getPermission(): BrowserNotificationPermission {
	if (
		typeof window === 'undefined' ||
		!window.isSecureContext ||
		!('Notification' in window)
	) {
		return 'unsupported';
	}

	return window.Notification.permission;
}

function isPageInBackground() {
	return document.visibilityState !== 'visible' || !document.hasFocus();
}

export function useBrowserNotifications(
	notifications: readonly Notification[],
	isLoading: boolean
) {
	const [permission, setPermission] =
		useState<BrowserNotificationPermission>('unsupported');
	const knownIdsRef = useRef<Set<string>>(new Set());
	const initializedRef = useRef(false);

	useEffect(() => {
		const syncPermission = () => setPermission(getPermission());
		syncPermission();
		window.addEventListener('focus', syncPermission);
		document.addEventListener('visibilitychange', syncPermission);

		return () => {
			window.removeEventListener('focus', syncPermission);
			document.removeEventListener('visibilitychange', syncPermission);
		};
	}, []);

	useEffect(() => {
		if (isLoading) return;

		if (!initializedRef.current) {
			knownIdsRef.current = rememberNotificationIds(
				knownIdsRef.current,
				notifications
			);
			initializedRef.current = true;
			return;
		}

		const newNotifications = getNewBrowserNotifications(
			notifications,
			knownIdsRef.current
		);
		knownIdsRef.current = rememberNotificationIds(
			knownIdsRef.current,
			notifications
		);

		if (permission !== 'granted' || !isPageInBackground()) return;

		for (const notification of newNotifications) {
			try {
				const browserNotification = new window.Notification(notification.title, {
					body: notification.message,
					tag: `codewise-${notification.id}`,
					data: notification.link
				});

				browserNotification.onclick = () => {
					window.focus();
					if (notification.link) {
						window.location.assign(notification.link);
					}
					browserNotification.close();
				};
			} catch {
				// Browser restrictions must not affect the in-app notification flow.
			}
		}
	}, [isLoading, notifications, permission]);

	const requestPermission = useCallback(async () => {
		if (getPermission() === 'unsupported') {
			setPermission('unsupported');
			return 'unsupported' as const;
		}

		if (window.Notification.permission !== 'default') {
			setPermission(window.Notification.permission);
			return window.Notification.permission;
		}

		try {
			const nextPermission = await window.Notification.requestPermission();
			setPermission(nextPermission);
			return nextPermission;
		} catch {
			const currentPermission = getPermission();
			setPermission(currentPermission);
			return currentPermission;
		}
	}, []);

	return {
		browserNotificationsSupported: permission !== 'unsupported',
		browserNotificationPermission: permission,
		requestBrowserNotificationPermission: requestPermission
	};
}
