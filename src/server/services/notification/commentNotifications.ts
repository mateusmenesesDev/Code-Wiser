import type { PrismaClient } from '@prisma/client';
import { getBaseUrl } from '~/server/utils/getBaseUrl';
import { createNotification, getAdminUsers } from './base';

interface NotifyTaskCommentParams {
	db: PrismaClient;
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
			memberships: {
				where: { status: 'ACTIVE' },
				select: {
					user: { select: { id: true, email: true, name: true } }
				}
			}
		}
	});

	if (!project) {
		console.warn(`Project ${projectId} not found for comment notification`);
		return;
	}

	const adminUsers = await getAdminUsers();

	const members = project.memberships.map(({ user }) => user);
	const memberIds = new Set(members.map((member) => member.id));

	const usersToNotify = [
		...members.filter((member) => member.id !== authorId),
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
