import type { PrismaClient } from '@prisma/client';
import { createNotification } from '~/server/services/notification/base';
import {
	REVIEW_SLA_HOURS,
	isUniqueConstraintError
} from './mentorAttention.service';

const MAX_OVERDUE_REVIEWS = 500;

function dayKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

export async function processMentorAttentionReminders(
	db: PrismaClient,
	now = new Date()
) {
	const cutoff = new Date(now.getTime() - REVIEW_SLA_HOURS * 3_600_000);
	const [prReviews, exerciseReviews, admins] = await Promise.all([
		db.pullRequestReview.findMany({
			where: {
				isActive: true,
				status: 'PENDING',
				createdAt: { lt: cutoff },
				task: { projectId: { not: null } }
			},
			orderBy: { createdAt: 'asc' },
			take: MAX_OVERDUE_REVIEWS,
			select: {
				id: true,
				createdAt: true,
				requestedBy: { select: { name: true, email: true } },
				task: {
					select: {
						id: true,
						title: true,
						project: { select: { id: true, title: true } }
					}
				}
			}
		}),
		db.exerciseReviewSubmission.findMany({
			where: { needsAttention: true, createdAt: { lt: cutoff } },
			orderBy: { createdAt: 'asc' },
			take: MAX_OVERDUE_REVIEWS,
			select: {
				id: true,
				createdAt: true,
				submittedBy: { select: { name: true, email: true } },
				track: { select: { name: true } }
			}
		}),
		db.user.findMany({
			where: { isOrgAdmin: true },
			select: { id: true }
		})
	]);

	const reviews = [
		...prReviews.map((review) => ({
			sourceType: 'PR_REVIEW' as const,
			id: review.id,
			createdAt: review.createdAt,
			learner: review.requestedBy.name || review.requestedBy.email,
			title: review.task.title,
			link: review.task.project
				? `/workspace/${review.task.project.id}?taskId=${review.task.id}`
				: '/admin/attention'
		})),
		...exerciseReviews.map((review) => ({
			sourceType: 'EXERCISE_REVIEW' as const,
			id: review.id,
			createdAt: review.createdAt,
			learner: review.submittedBy.name || review.submittedBy.email,
			title: 'Exercise submission',
			link: `/admin/exercise-reviews/${review.id}`
		}))
	];

	let created = 0;
	let failures = 0;
	const reviewDay = dayKey(now);

	for (const review of reviews) {
		const sourceType =
			review.sourceType === 'PR_REVIEW' ? 'PR_REVIEW' : 'EXERCISE_REVIEW';
		await db.mentorAttentionAssignment.updateMany({
			where: {
				sourceType,
				sourceId: review.id,
				escalatedAt: null
			},
			data: { escalatedAt: now }
		});

		for (const admin of admins) {
			try {
				await createNotification({
					db,
					userId: admin.id,
					type: 'MENTOR_REVIEW_OVERDUE',
					title: 'Overdue mentor review',
					message: `${review.title} for ${review.learner} has exceeded the ${REVIEW_SLA_HOURS}-hour review SLA.`,
					link: review.link,
					dedupeKey: `mentor-review-overdue:${sourceType}:${review.id}:${reviewDay}`
				});
				created += 1;
			} catch (error) {
				if (isUniqueConstraintError(error)) {
					continue;
				}
				failures += 1;
				console.error('Failed to create overdue mentor review alert:', error);
			}
		}
	}

	return { reviews: reviews.length, created, failures };
}
