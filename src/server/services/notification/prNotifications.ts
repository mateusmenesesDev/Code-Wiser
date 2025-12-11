import type { PrismaClient } from '@prisma/client';
import {
	sendPRRequestedEmail,
	sendPRResponseEmail
} from '../email/emailService';
import { getBaseUrl } from '~/server/utils/getBaseUrl';
import { createNotification, getAdminUsers } from './base';

interface NotifyPRRequestedParams {
	db: PrismaClient;
	memberName: string | null;
	projectId: string;
	projectName: string;
	taskId: string;
	taskTitle: string;
	prUrl: string;
}

export async function notifyPRRequested(
	params: NotifyPRRequestedParams
): Promise<void> {
	const { db, memberName, projectId, projectName, taskId, taskTitle, prUrl } =
		params;

	const baseUrl = getBaseUrl();
	const workspaceUrl = `${baseUrl}/workspace/${projectId}`;

	const adminUsers = await getAdminUsers();

	if (adminUsers.length === 0) {
		console.warn('No admin users found to notify');
		return;
	}

	await Promise.all(
		adminUsers.map(async (admin) => {
			await createNotification({
				db,
				userId: admin.id,
				type: 'PR_REQUESTED',
				title: 'Code Review Requested',
				message: `${memberName ?? 'A member'} requested a code review for "${taskTitle}" in "${projectName}"`,
				link: `${workspaceUrl}?taskId=${taskId}`
			});

			try {
				await sendPRRequestedEmail({
					mentorEmail: admin.email,
					mentorName: admin.name,
					memberName,
					projectName,
					taskTitle,
					prUrl,
					workspaceUrl: `${workspaceUrl}?taskId=${taskId}`
				});
			} catch (error) {
				console.error(`Failed to send email to ${admin.email}:`, error);
			}
		})
	);
}

interface NotifyPRResponseParams {
	db: PrismaClient;
	memberId: string;
	memberName: string | null;
	memberEmail: string;
	mentorName: string | null | undefined;
	projectId: string;
	projectName: string;
	taskId: string;
	taskTitle: string;
	status: 'APPROVED' | 'CHANGES_REQUESTED';
	comment?: string | null;
}

export async function notifyPRResponse(
	params: NotifyPRResponseParams
): Promise<void> {
	const {
		db,
		memberId,
		memberName,
		memberEmail,
		mentorName,
		projectId,
		projectName,
		taskId,
		taskTitle,
		status,
		comment
	} = params;

	const baseUrl = getBaseUrl();
	const workspaceUrl = `${baseUrl}/workspace/${projectId}?taskId=${taskId}`;

	const notificationType =
		status === 'APPROVED' ? 'PR_APPROVED' : 'PR_CHANGES_REQUESTED';
	const title =
		status === 'APPROVED' ? 'Code Review Approved' : 'Changes Requested';
	const message =
		status === 'APPROVED'
			? `${mentorName ?? 'Your mentor'} approved your code review for "${taskTitle}" in "${projectName}"`
			: `${mentorName ?? 'Your mentor'} requested changes on your code review for "${taskTitle}" in "${projectName}"`;

	await createNotification({
		db,
		userId: memberId,
		type: notificationType,
		title,
		message,
		link: workspaceUrl
	});

	try {
		await sendPRResponseEmail({
			memberEmail,
			memberName,
			mentorName,
			projectName,
			taskTitle,
			status,
			comment,
			workspaceUrl
		});
	} catch (error) {
		console.error(`Failed to send email to ${memberEmail}:`, error);
	}
}
