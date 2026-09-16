import { z } from 'zod';
import { peerReviewCalibrationPromptIds } from '~/features/cohorts/data/peerReviewCalibration';

export const cohortStatusSchema = z.enum([
	'DRAFT',
	'ACTIVE',
	'COMPLETED',
	'ARCHIVED'
]);

const cohortDates = {
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(1000).nullable().optional(),
	startsAt: z.coerce.date(),
	endsAt: z.coerce.date().nullable().optional()
};

export const createCohortSchema = z
	.object(cohortDates)
	.superRefine((input, context) => {
		if (input.endsAt && input.endsAt < input.startsAt) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['endsAt'],
				message: 'The cohort end date must be after its start date.'
			});
		}
	});

export const updateCohortSchema = z
	.object({
		id: z.string().min(1),
		...cohortDates,
		status: cohortStatusSchema
	})
	.superRefine((input, context) => {
		if (input.endsAt && input.endsAt < input.startsAt) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['endsAt'],
				message: 'The cohort end date must be after its start date.'
			});
		}
	});

export const cohortMemberSchema = z.object({
	cohortId: z.string().min(1),
	userId: z.string().min(1)
});

export const assignPeerReviewSchema = z.object({
	cohortId: z.string().min(1),
	reviewerId: z.string().min(1),
	pullRequestReviewId: z.string().min(1)
});

export const listPeerReviewSuggestionsSchema = z.object({
	cohortId: z.string().min(1),
	pullRequestReviewId: z.string().min(1)
});

export const cohortEventTypeSchema = z.enum([
	'KICKOFF',
	'CHECKPOINT',
	'DELIVERY',
	'CLOSURE',
	'RETROSPECTIVE'
]);

const cohortEventFields = z.object({
	cohortId: z.string().min(1),
	type: cohortEventTypeSchema,
	title: z.string().trim().min(1).max(160),
	description: z.string().trim().max(2000).nullable().optional(),
	startsAt: z.coerce.date(),
	endsAt: z.coerce.date().nullable().optional()
});

const validateCohortEventDates = (
	input: { startsAt: Date; endsAt?: Date | null },
	context: z.RefinementCtx
) => {
	if (input.endsAt && input.endsAt < input.startsAt) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['endsAt'],
			message: 'The event end date must be after its start date.'
		});
	}
};

export const createCohortEventSchema = cohortEventFields.superRefine(
	validateCohortEventDates
);

export const updateCohortEventSchema = cohortEventFields
	.omit({ cohortId: true })
	.extend({ id: z.string().min(1) })
	.superRefine(validateCohortEventDates);

export const completeCohortEventSchema = z.object({
	eventId: z.string().min(1)
});

export const assignCohortProjectSchema = z.object({
	cohortId: z.string().min(1),
	projectId: z.string().min(1)
});

export const cohortPeerReviewIdSchema = z.object({
	assignmentId: z.string().min(1)
});

export const submitPeerReviewSchema = cohortPeerReviewIdSchema.extend({
	feedback: z.string().trim().min(20).max(4000)
});

export const peerReviewCalibrationCategorySchema = z.enum([
	'CORRECTION',
	'SECURITY',
	'PERFORMANCE',
	'DESIGN',
	'TESTS',
	'READABILITY'
]);

export const getPeerReviewCalibrationSchema = z.object({
	cohortId: z.string().min(1)
});

export const completePeerReviewCalibrationSchema = z
	.object({
		cohortId: z.string().min(1),
		answers: z
			.array(
				z.object({
					promptId: z.enum(peerReviewCalibrationPromptIds),
					category: peerReviewCalibrationCategorySchema
				})
			)
			.length(peerReviewCalibrationPromptIds.length)
	})
	.superRefine((input, context) => {
		if (
			new Set(input.answers.map((answer) => answer.promptId)).size !==
			input.answers.length
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['answers'],
				message: 'Each calibration prompt must be answered once.'
			});
		}
	});

export const reportPeerReviewSchema = cohortPeerReviewIdSchema.extend({
	reason: z.string().trim().min(10).max(500)
});

export const resolvePeerReviewReportSchema = z.object({
	reportId: z.string().min(1),
	status: z.enum(['RESOLVED', 'DISMISSED']),
	resolutionNote: z.string().trim().max(500).nullable().optional()
});
