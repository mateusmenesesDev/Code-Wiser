import { LearningJourneyEventType, type PrismaClient } from '@prisma/client';

type LearningJourneyDb = Pick<PrismaClient, 'learningJourneyEvent'>;

type RecordLearningJourneyEventInput = {
	userId: string;
	eventType: LearningJourneyEventType;
	eventKey: string;
	entityType: string;
	entityId: string;
	recommendationKey?: string;
	occurredAt?: Date;
};

export async function recordLearningJourneyEvent(
	db: LearningJourneyDb,
	input: RecordLearningJourneyEventInput
) {
	return db.learningJourneyEvent.upsert({
		where: { eventKey: input.eventKey },
		create: {
			userId: input.userId,
			eventType: input.eventType,
			eventKey: input.eventKey,
			entityType: input.entityType,
			entityId: input.entityId,
			recommendationKey: input.recommendationKey,
			occurredAt: input.occurredAt
		},
		update: {}
	});
}

export function firstActionEventKey(userId: string) {
	return `first-action:${userId}`;
}

export async function tryRecordLearningJourneyEvent(
	db: LearningJourneyDb,
	input: RecordLearningJourneyEventInput
) {
	try {
		return await recordLearningJourneyEvent(db, input);
	} catch (error) {
		console.error('Learning journey analytics event failed:', error);
		return null;
	}
}

export async function tryRecordFirstLearningAction(
	db: LearningJourneyDb,
	userId: string,
	occurredAt = new Date()
) {
	return tryRecordLearningJourneyEvent(db, {
		userId,
		eventType: LearningJourneyEventType.FIRST_ACTION,
		eventKey: firstActionEventKey(userId),
		entityType: 'LEARNING_JOURNEY',
		entityId: userId,
		occurredAt
	});
}

type RecommendationEventType =
	| 'RECOMMENDATION_IMPRESSION'
	| 'RECOMMENDATION_STARTED';

export function recommendationEventKey(
	eventType: RecommendationEventType,
	userId: string,
	recommendationKey: string
) {
	return `recommendation:${eventType}:${userId}:${recommendationKey}`;
}

export function remediationCompletionEventKey(actionId: string) {
	return `remediation-completed:${actionId}`;
}

export function reviewResponseEventKey(reviewType: string, reviewId: string) {
	return `review-responded:${reviewType}:${reviewId}`;
}

export function secondEvaluationEventKey(reviewType: string, reviewId: string) {
	return `second-evaluation-approved:${reviewType}:${reviewId}`;
}
