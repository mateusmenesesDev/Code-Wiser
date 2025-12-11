import type { NotificationType, PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import {
	sendPRRequestedEmail,
	sendPRResponseEmail
} from '../email/emailService';
import { getBaseUrl } from '~/server/utils/getBaseUrl';

interface CreateNotificationParams {
	db: PrismaClient;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
}

export async function createNotification(
	params: CreateNotificationParams
): Promise<void> {
	const { db, userId, type, title, message, link } = params;

	await db.notification.create({
		data: {
			userId,
			type,
			title,
			message,
			link
		}
	});
}

async function getAdminUsers(): Promise<
	Array<{ id: string; email: string; name: string | null }>
> {
	try {
		const { db } = await import('~/server/db');
		const allUsers = await db.user.findMany({
			select: {
				id: true,
				email: true,
				name: true
			}
		});

		const adminUsers: Array<{
			id: string;
			email: string;
			name: string | null;
		}> = [];

		await Promise.all(
			allUsers.map(async (user) => {
				try {
					const organizationMemberships =
						await clerkClient.users.getOrganizationMembershipList({
							userId: user.id
						});

					const isAdmin = organizationMemberships.data.some(
						(membership) => membership.role === 'org:admin'
					);

					if (isAdmin) {
						adminUsers.push(user);
					}
				} catch {
					// Skip users that can't be fetched from Clerk
				}
			})
		);

		return adminUsers;
	} catch (error) {
		console.error('Failed to get admin users:', error);
		return [];
	}
}

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

interface NotifyTaskCommentParams {
	db: PrismaClient;
	commentId: string;
	authorId: string;
	authorName: string | null;
	taskId: string;
	taskTitle: string;
	projectId: string;
	projectName: string;
}

export async function notifyTaskComment(
	params: NotifyTaskCommentParams
): Promise<void> {
	const {
		db,
		authorId,
		authorName,
		taskId,
		taskTitle,
		projectId,
		projectName
	} = params;

	const baseUrl = getBaseUrl();
	const workspaceUrl = `${baseUrl}/workspace/${projectId}`;

	const project = await db.project.findUnique({
		where: { id: projectId },
		select: {
			members: {
				select: {
					id: true,
					email: true,
					name: true
				}
			}
		}
	});

	if (!project) {
		console.warn(`Project ${projectId} not found for comment notification`);
		return;
	}

	const adminUsers = await getAdminUsers();

	const memberIds = new Set(project.members.map((member) => member.id));

	const usersToNotify = [
		...project.members.filter((member) => member.id !== authorId),
		...adminUsers.filter((admin) => !memberIds.has(admin.id))
	];

	if (usersToNotify.length === 0) {
		return;
	}

	await Promise.all(
		usersToNotify.map(async (user) => {
			await createNotification({
				db,
				userId: user.id,
				type: 'TASK_COMMENT',
				title: 'New Comment on Task',
				message: `${authorName ?? 'Someone'} commented on "${taskTitle}" in "${projectName}"`,
				link: `${workspaceUrl}?taskId=${taskId}`
			});
		})
	);
}
