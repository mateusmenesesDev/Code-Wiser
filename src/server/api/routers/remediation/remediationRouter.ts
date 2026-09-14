import {
	RemediationActionStatus,
	RemediationActionTargetType
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	notifyRemediationActionCompleted,
	notifyRemediationActionSubmitted
} from '~/server/services/notification/notificationService';
import { getBaseUrl } from '~/server/utils/getBaseUrl';
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from '../../trpc';

const actionIdInput = z.object({ actionId: z.string().min(1) });

function actionLink(action: {
	targetType: RemediationActionTargetType;
	taskId: string | null;
	taskProjectId: string | null;
	challenge: { track: { slug: string }; slug: string } | null;
	bookingId: string | null;
}) {
	const baseUrl = getBaseUrl();
	if (
		action.targetType === RemediationActionTargetType.TASK &&
		action.taskId &&
		action.taskProjectId
	) {
		return `${baseUrl}/workspace/${action.taskProjectId}?taskId=${action.taskId}`;
	}
	if (
		action.targetType === RemediationActionTargetType.EXERCISE &&
		action.challenge
	) {
		return `${baseUrl}/exercises/${action.challenge.track.slug}/${action.challenge.slug}`;
	}
	if (action.targetType === RemediationActionTargetType.MENTORSHIP) {
		return `${baseUrl}/mentorship${action.bookingId ? `?bookingId=${action.bookingId}` : ''}`;
	}
	return `${baseUrl}/`;
}

const actionInclude = {
	task: { select: { id: true, title: true, projectId: true } },
	challenge: {
		select: {
			slug: true,
			title: true,
			track: { select: { slug: true, name: true } }
		}
	},
	booking: { select: { id: true, scheduledAt: true } }
} as const;

export const remediationRouter = createTRPCRouter({
	getMine: protectedProcedure.query(async ({ ctx }) =>
		ctx.db.remediationAction.findMany({
			where: {
				learnerId: ctx.session.userId,
				status: { not: RemediationActionStatus.CANCELLED }
			},
			orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { updatedAt: 'desc' }],
			take: 20,
			include: actionInclude
		})
	),

	start: protectedProcedure
		.input(actionIdInput)
		.mutation(async ({ ctx, input }) => {
			const updated = await ctx.db.remediationAction.updateMany({
				where: {
					id: input.actionId,
					learnerId: ctx.session.userId,
					status: RemediationActionStatus.OPEN
				},
				data: { status: RemediationActionStatus.IN_PROGRESS }
			});
			if (updated.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This remediation action is no longer open'
				});
			}
			return { success: true };
		}),

	submit: protectedProcedure
		.input(
			actionIdInput.extend({
				evidenceNote: z.string().trim().min(1).max(2000)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const action = await ctx.db.remediationAction.findFirst({
				where: {
					id: input.actionId,
					learnerId: ctx.session.userId,
					status: {
						in: [
							RemediationActionStatus.OPEN,
							RemediationActionStatus.IN_PROGRESS
						]
					}
				},
				include: {
					task: { select: { id: true, projectId: true } },
					challenge: {
						select: { slug: true, track: { select: { slug: true } } }
					},
					learner: { select: { name: true } }
				}
			});
			if (!action) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This remediation action cannot be submitted'
				});
			}

			const updated = await ctx.db.remediationAction.updateMany({
				where: {
					id: action.id,
					learnerId: ctx.session.userId,
					status: {
						in: [
							RemediationActionStatus.OPEN,
							RemediationActionStatus.IN_PROGRESS
						]
					}
				},
				data: {
					status: RemediationActionStatus.SUBMITTED,
					evidenceNote: input.evidenceNote,
					submittedAt: new Date()
				}
			});
			if (updated.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message:
						'This remediation action changed while you were submitting it'
				});
			}

			await notifyRemediationActionSubmitted({
				db: ctx.db,
				learnerName: action.learner.name,
				title: action.title,
				link: actionLink({
					targetType: action.targetType,
					taskId: action.task?.id ?? null,
					taskProjectId: action.task?.projectId ?? null,
					challenge: action.challenge
						? { slug: action.challenge.slug, track: action.challenge.track }
						: null,
					bookingId: null
				})
			}).catch((error) => {
				console.error(
					'Failed to send remediation submission notification:',
					error
				);
			});
			return { success: true };
		}),

	review: adminProcedure
		.input(
			actionIdInput.extend({
				status: z.enum([
					RemediationActionStatus.COMPLETED,
					RemediationActionStatus.OPEN,
					RemediationActionStatus.CANCELLED
				]),
				reviewerNote: z.string().trim().max(2000).nullable().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const action = await ctx.db.remediationAction.findUnique({
				where: { id: input.actionId },
				include: {
					challenge: {
						select: { slug: true, track: { select: { slug: true } } }
					},
					task: { select: { id: true, projectId: true } }
				}
			});
			if (!action) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' });
			}
			if (action.status === RemediationActionStatus.CANCELLED) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'Cancelled actions cannot be reviewed'
				});
			}

			const completed = input.status === RemediationActionStatus.COMPLETED;
			const updated = await ctx.db.remediationAction.updateMany({
				where: {
					id: action.id,
					status: { not: RemediationActionStatus.CANCELLED }
				},
				data: {
					status: input.status,
					reviewerNote: input.reviewerNote ?? null,
					completedAt: completed ? new Date() : null,
					completedById: completed ? ctx.session.userId : null
				}
			});
			if (updated.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This remediation action changed while you were reviewing it'
				});
			}

			if (completed) {
				await notifyRemediationActionCompleted({
					db: ctx.db,
					learnerId: action.learnerId,
					title: action.title,
					link: actionLink({
						targetType: action.targetType,
						taskId: action.task?.id ?? null,
						taskProjectId: action.task?.projectId ?? null,
						challenge: action.challenge,
						bookingId: action.bookingId
					})
				}).catch((error) => {
					console.error(
						'Failed to send remediation completion notification:',
						error
					);
				});
			}
			return { success: true };
		})
});
