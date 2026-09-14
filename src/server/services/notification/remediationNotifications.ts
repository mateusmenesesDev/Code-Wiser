import type { PrismaClient } from '@prisma/client';
import { createNotification, getAdminUsers } from './base';

export async function notifyRemediationActionSubmitted(params: {
	db: PrismaClient;
	learnerName: string | null;
	title: string;
	link: string;
}): Promise<void> {
	const adminUsers = await getAdminUsers();
	await Promise.all(
		adminUsers.map((admin) =>
			createNotification({
				db: params.db,
				userId: admin.id,
				type: 'REMEDIATION_ACTION_SUBMITTED',
				title: 'Remediation action submitted',
				message: `${params.learnerName ?? 'A learner'} submitted evidence for "${params.title}"`,
				link: params.link
			})
		)
	);
}

export async function notifyRemediationActionCompleted(params: {
	db: PrismaClient;
	learnerId: string;
	title: string;
	link: string;
}): Promise<void> {
	await createNotification({
		db: params.db,
		userId: params.learnerId,
		type: 'REMEDIATION_ACTION_COMPLETED',
		title: 'Action completed',
		message: `Your remediation action "${params.title}" was completed`,
		link: params.link
	});
}
