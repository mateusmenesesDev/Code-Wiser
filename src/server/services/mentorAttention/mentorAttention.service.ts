import {
	MentorAttentionSourceType,
	Prisma,
	type PrismaClient
} from '@prisma/client';

export const MENTOR_ATTENTION_CAPACITY = 5;
export const REVIEW_SLA_HOURS = 48;
export const GENERAL_SLA_HOURS = 72;

export function slaHoursFor(sourceType: MentorAttentionSourceType) {
	return sourceType === MentorAttentionSourceType.PR_REVIEW ||
		sourceType === MentorAttentionSourceType.EXERCISE_REVIEW
		? REVIEW_SLA_HOURS
		: GENERAL_SLA_HOURS;
}

export function dueAtFor(
	sourceType: MentorAttentionSourceType,
	sourceCreatedAt: Date
) {
	return new Date(
		sourceCreatedAt.getTime() + slaHoursFor(sourceType) * 3_600_000
	);
}

export function minutesBetween(start: Date, end: Date) {
	return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60_000));
}

type AttentionDb = Pick<PrismaClient, 'mentorAttentionAssignment'>;

export async function completeMentorAttention(
	db: AttentionDb,
	sourceType: MentorAttentionSourceType,
	sourceId: string,
	completedById: string,
	completedAt = new Date()
) {
	const assignment = await db.mentorAttentionAssignment.findUnique({
		where: { sourceType_sourceId: { sourceType, sourceId } },
		select: { id: true, sourceCreatedAt: true, completedAt: true }
	});

	if (!assignment || assignment.completedAt) return false;

	await db.mentorAttentionAssignment.update({
		where: { id: assignment.id },
		data: {
			completedAt,
			completionMinutes: minutesBetween(
				assignment.sourceCreatedAt,
				completedAt
			),
			completedById
		}
	});

	return true;
}

export function isUniqueConstraintError(error: unknown) {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === 'P2002'
	);
}
