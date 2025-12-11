import type { PrismaClient } from '@prisma/client';
import { getBaseUrl } from '~/server/utils/getBaseUrl';
import { createNotification, getAdminUsers } from './base';

interface NotifyTaskAssignedParams {
	db: PrismaClient;
	taskId: string;
	taskTitle: string;
	assigneeId: string;
	projectId: string;
	projectName: string;
}

export async function notifyTaskAssigned(
	params: NotifyTaskAssignedParams
): Promise<void> {
	const { db, taskId, taskTitle, assigneeId, projectId, projectName } = params;

	const baseUrl = getBaseUrl();
	const workspaceUrl = `${baseUrl}/workspace/${projectId}?taskId=${taskId}`;

	await createNotification({
		db,
		userId: assigneeId,
		type: 'TASK_ASSIGNED',
		title: 'Task Assigned',
		message: `You have been assigned to "${taskTitle}" in "${projectName}"`,
		link: workspaceUrl
	});
}

interface NotifyTaskStatusChangedParams {
	db: PrismaClient;
	taskId: string;
	taskTitle: string;
	oldStatus: string;
	newStatus: string;
	assigneeId: string | null;
	projectId: string;
	projectName: string;
	changedByUserId: string;
	changedByName: string | null;
}

export async function notifyTaskStatusChanged(
	params: NotifyTaskStatusChangedParams
): Promise<void> {
	const {
		db,
		taskId,
		taskTitle,
		oldStatus,
		newStatus,
		assigneeId,
		projectId,
		projectName,
		changedByUserId,
		changedByName
	} = params;

	const baseUrl = getBaseUrl();
	const workspaceUrl = `${baseUrl}/workspace/${projectId}?taskId=${taskId}`;

	const statusLabels: Record<string, string> = {
		BACKLOG: 'Backlog',
		READY_TO_DEVELOP: 'Ready to Develop',
		IN_PROGRESS: 'In Progress',
		CODE_REVIEW: 'Code Review',
		TESTING: 'Testing',
		DONE: 'Done'
	};

	const oldStatusLabel = statusLabels[oldStatus] ?? oldStatus;
	const newStatusLabel = statusLabels[newStatus] ?? newStatus;

	const usersToNotify: string[] = [];

	if (assigneeId && assigneeId !== changedByUserId) {
		usersToNotify.push(assigneeId);
	}

	const adminUsers = await getAdminUsers();
	for (const admin of adminUsers) {
		if (admin.id !== changedByUserId && !usersToNotify.includes(admin.id)) {
			usersToNotify.push(admin.id);
		}
	}

	if (usersToNotify.length === 0) {
		return;
	}

	await Promise.all(
		usersToNotify.map(async (userId) => {
			await createNotification({
				db,
				userId,
				type: 'TASK_STATUS_CHANGED',
				title: 'Task Status Changed',
				message: `${changedByName ?? 'Someone'} changed "${taskTitle}" from ${oldStatusLabel} to ${newStatusLabel} in "${projectName}"`,
				link: workspaceUrl
			});
		})
	);
}

interface NotifyTaskBlockedParams {
	db: PrismaClient;
	taskId: string;
	taskTitle: string;
	isBlocked: boolean;
	assigneeId: string | null;
	projectId: string;
	projectName: string;
	changedByUserId: string;
	changedByName: string | null;
}

export async function notifyTaskBlocked(
	params: NotifyTaskBlockedParams
): Promise<void> {
	const {
		db,
		taskId,
		taskTitle,
		isBlocked,
		assigneeId,
		projectId,
		projectName,
		changedByUserId,
		changedByName
	} = params;

	const baseUrl = getBaseUrl();
	const workspaceUrl = `${baseUrl}/workspace/${projectId}?taskId=${taskId}`;

	const notificationType = isBlocked ? 'TASK_BLOCKED' : 'TASK_UNBLOCKED';
	const title = isBlocked ? 'Task Blocked' : 'Task Unblocked';
	const message = isBlocked
		? `${changedByName ?? 'Someone'} blocked "${taskTitle}" in "${projectName}"`
		: `${changedByName ?? 'Someone'} unblocked "${taskTitle}" in "${projectName}"`;

	const usersToNotify: string[] = [];

	if (assigneeId && assigneeId !== changedByUserId) {
		usersToNotify.push(assigneeId);
	}

	const adminUsers = await getAdminUsers();
	for (const admin of adminUsers) {
		if (admin.id !== changedByUserId && !usersToNotify.includes(admin.id)) {
			usersToNotify.push(admin.id);
		}
	}

	if (usersToNotify.length === 0) {
		return;
	}

	await Promise.all(
		usersToNotify.map(async (userId) => {
			await createNotification({
				db,
				userId,
				type: notificationType,
				title,
				message,
				link: workspaceUrl
			});
		})
	);
}
