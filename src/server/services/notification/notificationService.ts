/**
 * Notification Service - Main export file
 *
 * This file re-exports all notification functions for backward compatibility
 * and provides a centralized import point.
 */

export { createNotification, getAdminUsers } from './base';
export { notifyPRRequested, notifyPRResponse } from './prNotifications';
export { notifyTaskComment } from './commentNotifications';
export {
	notifyTaskAssigned,
	notifyTaskStatusChanged,
	notifyTaskBlocked
} from './taskNotifications';
