import type { PrismaClient } from '@prisma/client';
import { getBaseUrl } from '~/server/utils/getBaseUrl';
import { createNotification, getAdminUsers } from './base';

interface NotifyExerciseReviewRequestedParams {
	db: PrismaClient;
	memberName: string | null;
	submissionId: string;
	trackName: string;
	challengeTitles: string[];
	prUrl: string;
}

export async function notifyExerciseReviewRequested(
	params: NotifyExerciseReviewRequestedParams
): Promise<void> {
	const { db, memberName, submissionId, trackName, challengeTitles } = params;
	const link = `${getBaseUrl()}/admin/exercise-reviews/${submissionId}`;
	const titles = challengeTitles.join(', ');

	const adminUsers = await getAdminUsers();
	if (adminUsers.length === 0) {
		console.warn('No admin users found to notify about exercise review');
		return;
	}

	await Promise.all(
		adminUsers.map((admin) =>
			createNotification({
				db,
				userId: admin.id,
				type: 'EXERCISE_REVIEW_REQUESTED',
				title: 'Exercise Review Requested',
				message: `${memberName ?? 'A member'} requested review for ${titles} in "${trackName}"`,
				link
			})
		)
	);
}

interface NotifyExercisePrUpdatedParams {
	db: PrismaClient;
	memberName: string | null;
	submissionId: string;
	trackName: string;
	challengeTitles: string[];
	updateNote?: string | null;
}

export async function notifyExercisePrUpdated(
	params: NotifyExercisePrUpdatedParams
): Promise<void> {
	const {
		db,
		memberName,
		submissionId,
		trackName,
		challengeTitles,
		updateNote
	} = params;
	const link = `${getBaseUrl()}/admin/exercise-reviews/${submissionId}`;
	const titles = challengeTitles.join(', ');
	const noteSuffix = updateNote?.trim()
		? `. Note: ${updateNote.trim()}`
		: '';

	const adminUsers = await getAdminUsers();
	if (adminUsers.length === 0) {
		console.warn('No admin users found to notify about exercise PR update');
		return;
	}

	await Promise.all(
		adminUsers.map((admin) =>
			createNotification({
				db,
				userId: admin.id,
				type: 'EXERCISE_PR_UPDATED',
				title: 'Exercise PR Updated',
				message: `${memberName ?? 'A member'} updated the PR for ${titles} in "${trackName}"${noteSuffix}`,
				link
			})
		)
	);
}

interface NotifyExerciseChallengeResponseParams {
	db: PrismaClient;
	memberId: string;
	mentorName: string | null | undefined;
	challengeTitle: string;
	trackSlug: string;
	challengeSlug: string;
	status: 'APPROVED' | 'CHANGES_REQUESTED';
	mentorComment?: string | null;
}

export async function notifyExerciseChallengeResponse(
	params: NotifyExerciseChallengeResponseParams
): Promise<void> {
	const {
		db,
		memberId,
		mentorName,
		challengeTitle,
		trackSlug,
		challengeSlug,
		status
	} = params;

	const link = `${getBaseUrl()}/exercises/${trackSlug}/${challengeSlug}`;
	const isApproved = status === 'APPROVED';

	await createNotification({
		db,
		userId: memberId,
		type: isApproved
			? 'EXERCISE_CHALLENGE_APPROVED'
			: 'EXERCISE_CHANGES_REQUESTED',
		title: isApproved
			? 'Exercise Challenge Approved'
			: 'Exercise Changes Requested',
		message: isApproved
			? `${mentorName ?? 'Your mentor'} approved your exercise challenge "${challengeTitle}"`
			: `${mentorName ?? 'Your mentor'} requested changes on your exercise challenge "${challengeTitle}"`,
		link
	});
}
