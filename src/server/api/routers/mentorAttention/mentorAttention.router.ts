import {
	MentorAttentionSourceType,
	Prisma,
	type PrismaClient
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '~/server/api/trpc';
import {
	MENTOR_ATTENTION_CAPACITY,
	dueAtFor,
	isUniqueConstraintError,
	minutesBetween
} from '~/server/services/mentorAttention/mentorAttention.service';

const QUEUE_LIMIT = 20;
const INACTIVITY_DAYS = 14;
const UPCOMING_SESSION_DAYS = 14;
const HIGH_PRIORITY_SESSION_DAYS = 3;

const attentionSourceSchema = z.enum([
	'PR_REVIEW',
	'EXERCISE_REVIEW',
	'BLOCKED_TASK',
	'INACTIVE_STUDENT',
	'MENTORSHIP_SESSION'
]);

const queueTypeSchema = z.enum([
	'PR_REVIEW',
	'EXERCISE_REVIEW',
	'BLOCKED_TASK',
	'INACTIVE_STUDENT',
	'MENTORSHIP_SESSION'
]);
const queuePrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
const queueSourceSchema = z.enum([
	'prReview',
	'exerciseReview',
	'blockedTask',
	'inactiveStudent',
	'mentorshipSession'
]);
const cursorSchema = z.object({
	prReview: z.string().optional(),
	exerciseReview: z.string().optional(),
	blockedTask: z.string().optional(),
	inactiveStudent: z.string().optional(),
	mentorshipSession: z.string().optional()
});

type QueueSource = z.infer<typeof queueSourceSchema>;
type QueuePriority = z.infer<typeof queuePrioritySchema>;

type QueueCursor = Partial<Record<QueueSource, string>>;

const getQueueSchema = z.object({
	limit: z.number().int().min(1).max(QUEUE_LIMIT).default(QUEUE_LIMIT),
	cursor: z.string().nullish(),
	type: queueTypeSchema.or(z.literal('all')).default('all'),
	priority: queuePrioritySchema.or(z.literal('all')).default('all'),
	search: z.string().trim().max(100).optional()
});

const sourceByType: Record<z.infer<typeof queueTypeSchema>, QueueSource> = {
	PR_REVIEW: 'prReview',
	EXERCISE_REVIEW: 'exerciseReview',
	BLOCKED_TASK: 'blockedTask',
	INACTIVE_STUDENT: 'inactiveStudent',
	MENTORSHIP_SESSION: 'mentorshipSession'
};

function encodeCursor(cursor: QueueCursor) {
	return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(value: string | null | undefined): QueueCursor {
	if (!value) return {};

	try {
		const parsed = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8')
		) as unknown;
		return cursorSchema.parse(parsed);
	} catch {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Invalid attention queue cursor'
		});
	}
}

function cursorArgs(
	cursor: QueueCursor,
	source: QueueSource
): { cursor?: { id: string }; skip?: number } {
	const id = cursor[source];
	return id ? { cursor: { id }, skip: 1 } : {};
}

function taskPriority(priority: string | null | undefined): QueuePriority {
	if (priority === 'HIGHEST' || priority === 'HIGH') return 'HIGH';
	if (priority === 'MEDIUM') return 'MEDIUM';
	return 'LOW';
}

function priorityRank(priority: QueuePriority) {
	return priority === 'HIGH' ? 0 : priority === 'MEDIUM' ? 1 : 2;
}

function ageInHours(createdAt: Date, now: Date) {
	return Math.max(
		0,
		Math.floor((now.getTime() - createdAt.getTime()) / 3_600_000)
	);
}

function sourceTypeFor(source: QueueSource) {
	return {
		prReview: MentorAttentionSourceType.PR_REVIEW,
		exerciseReview: MentorAttentionSourceType.EXERCISE_REVIEW,
		blockedTask: MentorAttentionSourceType.BLOCKED_TASK,
		inactiveStudent: MentorAttentionSourceType.INACTIVE_STUDENT,
		mentorshipSession: MentorAttentionSourceType.MENTORSHIP_SESSION
	}[source];
}

function sourceKey(sourceType: MentorAttentionSourceType, sourceId: string) {
	return `${sourceType}:${sourceId}`;
}

async function getActiveClaimSource(
	db: PrismaClient,
	sourceType: MentorAttentionSourceType,
	sourceId: string,
	now: Date
) {
	if (sourceType === MentorAttentionSourceType.PR_REVIEW) {
		const review = await db.pullRequestReview.findFirst({
			where: {
				id: sourceId,
				isActive: true,
				status: 'PENDING',
				task: { projectId: { not: null } }
			},
			select: { createdAt: true }
		});
		return review ? { sourceCreatedAt: review.createdAt } : null;
	}

	if (sourceType === MentorAttentionSourceType.EXERCISE_REVIEW) {
		const submission = await db.exerciseReviewSubmission.findFirst({
			where: { id: sourceId, needsAttention: true },
			select: { createdAt: true }
		});
		return submission ? { sourceCreatedAt: submission.createdAt } : null;
	}

	if (sourceType === MentorAttentionSourceType.BLOCKED_TASK) {
		const task = await db.task.findFirst({
			where: { id: sourceId, blocked: true, project: { canceledAt: null } },
			select: { updatedAt: true }
		});
		return task ? { sourceCreatedAt: task.updatedAt } : null;
	}

	if (sourceType === MentorAttentionSourceType.INACTIVE_STUDENT) {
		const inactivityCutoff = new Date(
			now.getTime() - INACTIVITY_DAYS * 86_400_000
		);
		const student = await db.user.findFirst({
			where: {
				id: sourceId,
				isOrgAdmin: false,
				updatedAt: { lt: inactivityCutoff }
			},
			select: { updatedAt: true }
		});
		return student ? { sourceCreatedAt: student.updatedAt } : null;
	}

	const session = await db.mentorshipBooking.findFirst({
		where: {
			id: sourceId,
			status: 'SCHEDULED',
			scheduledAt: {
				gte: now,
				lt: new Date(now.getTime() + UPCOMING_SESSION_DAYS * 86_400_000)
			},
			OR: [{ objective: null }, { objective: '' }]
		},
		select: { createdAt: true }
	});
	return session ? { sourceCreatedAt: session.createdAt } : null;
}

export const mentorAttentionRouter = createTRPCRouter({
	getQueue: adminProcedure
		.input(getQueueSchema)
		.query(async ({ ctx, input }) => {
			const now = new Date();
			const inactivityCutoff = new Date(
				now.getTime() - INACTIVITY_DAYS * 86_400_000
			);
			const cursor = decodeCursor(input.cursor);
			const search = input.search || undefined;
			const requestedSources =
				input.type === 'all'
					? (Object.values(sourceByType) as QueueSource[])
					: [sourceByType[input.type]];
			const sourceLimit = input.limit + 1;
			const taskFilters: import('@prisma/client').Prisma.TaskWhereInput[] = [];
			if (input.priority === 'HIGH') {
				taskFilters.push({ priority: { in: ['HIGHEST', 'HIGH'] } });
			} else if (input.priority === 'MEDIUM') {
				taskFilters.push({ priority: 'MEDIUM' });
			} else if (input.priority === 'LOW') {
				taskFilters.push({
					OR: [{ priority: { in: ['LOW', 'LOWEST'] } }, { priority: null }]
				});
			}
			if (search) {
				taskFilters.push({
					OR: [
						{ title: { contains: search, mode: 'insensitive' } },
						{ project: { title: { contains: search, mode: 'insensitive' } } },
						{
							assignees: {
								some: {
									OR: [
										{ name: { contains: search, mode: 'insensitive' } },
										{ email: { contains: search, mode: 'insensitive' } }
									]
								}
							}
						}
					]
				});
			}

			const [
				prReviews,
				exerciseReviews,
				blockedTasks,
				inactiveStudents,
				sessions
			] = await Promise.all([
				ctx.db.pullRequestReview.findMany({
					where: {
						id: requestedSources.includes('prReview') ? undefined : { in: [] },
						isActive: true,
						status: 'PENDING',
						task: { projectId: { not: null }, AND: taskFilters }
					},
					orderBy: [
						{ task: { priority: 'desc' } },
						{ createdAt: 'asc' },
						{ id: 'asc' }
					],
					take: sourceLimit,
					...cursorArgs(cursor, 'prReview'),
					include: {
						requestedBy: { select: { id: true, name: true, email: true } },
						task: {
							select: {
								id: true,
								title: true,
								priority: true,
								project: { select: { id: true, title: true } }
							}
						}
					}
				}),
				ctx.db.exerciseReviewSubmission.findMany({
					where: {
						id:
							requestedSources.includes('exerciseReview') &&
							input.priority !== 'MEDIUM' &&
							input.priority !== 'LOW'
								? undefined
								: { in: [] },
						needsAttention: true,
						...(search
							? {
									OR: [
										{
											track: {
												name: { contains: search, mode: 'insensitive' }
											}
										},
										{
											submittedBy: {
												OR: [
													{
														name: { contains: search, mode: 'insensitive' }
													},
													{
														email: { contains: search, mode: 'insensitive' }
													}
												]
											}
										}
									]
								}
							: {})
					},
					orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
					take: sourceLimit,
					...cursorArgs(cursor, 'exerciseReview'),
					include: {
						track: { select: { id: true, name: true, slug: true } },
						submittedBy: { select: { id: true, name: true, email: true } },
						decisions: {
							where: { status: 'PENDING' },
							select: { id: true, challenge: { select: { title: true } } }
						}
					}
				}),
				ctx.db.task.findMany({
					where: {
						id:
							requestedSources.includes('blockedTask') &&
							input.priority !== 'LOW'
								? undefined
								: { in: [] },
						blocked: true,
						projectId: { not: null },
						AND: taskFilters,
						project: { canceledAt: null }
					},
					orderBy: [{ priority: 'desc' }, { updatedAt: 'asc' }, { id: 'asc' }],
					take: sourceLimit,
					...cursorArgs(cursor, 'blockedTask'),
					select: {
						id: true,
						title: true,
						priority: true,
						createdAt: true,
						updatedAt: true,
						project: {
							select: {
								id: true,
								title: true,
								memberships: {
									where: { status: 'ACTIVE' },
									select: {
										role: true,
										user: { select: { id: true, name: true, email: true } }
									}
								}
							}
						},
						assignees: { select: { id: true, name: true, email: true } }
					}
				}),
				ctx.db.user.findMany({
					where: {
						id:
							requestedSources.includes('inactiveStudent') &&
							input.priority !== 'HIGH' &&
							input.priority !== 'LOW'
								? undefined
								: { in: [] },
						isOrgAdmin: false,
						updatedAt: {
							lt: inactivityCutoff
						},
						NOT: [
							{ tasks: { some: { updatedAt: { gte: inactivityCutoff } } } },
							{
								projectMemberships: {
									some: {
										updatedAt: { gte: inactivityCutoff },
										status: 'ACTIVE'
									}
								}
							},
							{
								challengeProgress: {
									some: { updatedAt: { gte: inactivityCutoff } }
								}
							},
							{
								exerciseReviewSubmissions: {
									some: { updatedAt: { gte: inactivityCutoff } }
								}
							},
							{
								prReviewsRequested: {
									some: { updatedAt: { gte: inactivityCutoff } }
								}
							},
							{
								mentorshipBookings: {
									some: { updatedAt: { gte: inactivityCutoff } }
								}
							}
						],
						AND: [
							{
								OR: [
									{ mentorshipStatus: 'ACTIVE' },
									{
										projectMemberships: {
											some: { status: 'ACTIVE', project: { canceledAt: null } }
										}
									},
									{
										challengeProgress: {
											some: { status: { not: 'NOT_STARTED' } }
										}
									},
									{ exerciseReviewSubmissions: { some: {} } },
									{
										prReviewsRequested: {
											some: { task: { projectId: { not: null } } }
										}
									},
									{ mentorshipBookings: { some: { status: 'SCHEDULED' } } }
								]
							},
							...(search
								? [
										{
											OR: [
												{
													name: {
														contains: search,
														mode: 'insensitive' as const
													}
												},
												{
													email: {
														contains: search,
														mode: 'insensitive' as const
													}
												}
											]
										}
									]
								: [])
						]
					},
					orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
					take: sourceLimit,
					...cursorArgs(cursor, 'inactiveStudent'),
					select: { id: true, name: true, email: true, updatedAt: true }
				}),
				ctx.db.mentorshipBooking.findMany({
					where: {
						id:
							requestedSources.includes('mentorshipSession') &&
							input.priority !== 'LOW'
								? undefined
								: { in: [] },
						status: 'SCHEDULED',
						scheduledAt: {
							gte: now,
							...(input.priority === 'HIGH'
								? {
										lt: new Date(
											now.getTime() + HIGH_PRIORITY_SESSION_DAYS * 86_400_000
										)
									}
								: input.priority === 'MEDIUM'
									? {
											gte: new Date(
												now.getTime() + HIGH_PRIORITY_SESSION_DAYS * 86_400_000
											),
											lt: new Date(
												now.getTime() + UPCOMING_SESSION_DAYS * 86_400_000
											)
										}
									: {
											lt: new Date(
												now.getTime() + UPCOMING_SESSION_DAYS * 86_400_000
											)
										})
						},
						OR: [{ objective: null }, { objective: '' }],
						...(search
							? {
									user: {
										OR: [
											{ name: { contains: search, mode: 'insensitive' } },
											{ email: { contains: search, mode: 'insensitive' } }
										]
									}
								}
							: {})
					},
					orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
					take: sourceLimit,
					...cursorArgs(cursor, 'mentorshipSession'),
					select: {
						id: true,
						createdAt: true,
						scheduledAt: true,
						bookingUrl: true,
						user: { select: { id: true, name: true, email: true } }
					}
				})
			]);

			const items = [
				...prReviews.map((review) => ({
					type: 'PR_REVIEW' as const,
					id: review.id,
					title: review.task.title,
					context: review.task.project?.title ?? 'Project',
					learner: review.requestedBy,
					priority: taskPriority(review.task.priority),
					createdAt: review.createdAt,
					ageInHours: ageInHours(review.createdAt, now),
					nextAction: 'Review pull request',
					directUrl: review.task.project
						? `/workspace/${review.task.project.id}?taskId=${review.task.id}`
						: '/admin/pr-reviews',
					source: 'prReview' as const
				})),
				...exerciseReviews.map((submission) => ({
					type: 'EXERCISE_REVIEW' as const,
					id: submission.id,
					title: submission.decisions
						.map((decision) => decision.challenge.title)
						.join(', '),
					context: submission.track.name,
					learner: submission.submittedBy,
					priority: 'HIGH' as const,
					createdAt: submission.createdAt,
					ageInHours: ageInHours(submission.createdAt, now),
					nextAction: 'Review exercise submission',
					directUrl: `/admin/exercise-reviews/${submission.id}`,
					source: 'exerciseReview' as const
				})),
				...blockedTasks.map((task) => ({
					type: 'BLOCKED_TASK' as const,
					id: task.id,
					title: task.title,
					context: task.project?.title ?? 'Project',
					learner:
						task.assignees[0] ??
						task.project?.memberships.find(
							(membership) => membership.role === 'LEARNER'
						)?.user ??
						task.project?.memberships[0]?.user ??
						null,
					priority: taskPriority(task.priority),
					createdAt: task.updatedAt,
					ageInHours: ageInHours(task.updatedAt, now),
					nextAction: 'Unblock task',
					directUrl: task.project
						? `/workspace/${task.project.id}?taskId=${task.id}`
						: '/admin',
					source: 'blockedTask' as const
				})),
				...inactiveStudents.map((student) => ({
					type: 'INACTIVE_STUDENT' as const,
					id: student.id,
					title: student.name || student.email,
					context: 'Learner activity',
					learner: student,
					priority: 'MEDIUM' as const,
					createdAt: student.updatedAt,
					ageInHours: ageInHours(student.updatedAt, now),
					nextAction: 'Check in with learner',
					directUrl: `/admin/users?userId=${student.id}`,
					source: 'inactiveStudent' as const
				})),
				...sessions.map((session) => {
					return {
						type: 'MENTORSHIP_SESSION' as const,
						id: session.id,
						title: `Session ${session.scheduledAt.toLocaleDateString()}`,
						context: 'Mentorship',
						learner: session.user,
						priority:
							session.scheduledAt.getTime() - now.getTime() <=
							HIGH_PRIORITY_SESSION_DAYS * 86_400_000
								? ('HIGH' as const)
								: ('MEDIUM' as const),
						createdAt: session.createdAt,
						ageInHours: ageInHours(session.createdAt, now),
						nextAction: 'Add session objective',
						directUrl: `/admin/mentorship?bookingId=${session.id}`,
						source: 'mentorshipSession' as const
					};
				})
			].sort((a, b) => {
				const priorityDiff =
					priorityRank(a.priority) - priorityRank(b.priority);
				return priorityDiff || a.createdAt.getTime() - b.createdAt.getTime();
			});

			const assignmentRows = items.length
				? await ctx.db.mentorAttentionAssignment.findMany({
						where: {
							OR: items.map((item) => ({
								sourceType: sourceTypeFor(item.source),
								sourceId: item.id
							}))
						},
						include: {
							assignedMentor: { select: { id: true, name: true, email: true } }
						}
					})
				: [];
			const assignmentsByKey = new Map(
				assignmentRows.map((assignment) => [
					sourceKey(assignment.sourceType, assignment.sourceId),
					assignment
				])
			);

			const page = items.slice(0, input.limit).map((item) => {
				const sourceType = sourceTypeFor(item.source);
				const assignment = assignmentsByKey.get(sourceKey(sourceType, item.id));
				const slaStart = assignment?.sourceCreatedAt ?? item.createdAt;
				const dueAt = assignment?.dueAt ?? dueAtFor(sourceType, slaStart);
				const isOverdue =
					!assignment?.completedAt && dueAt.getTime() < now.getTime();

				return {
					...item,
					dueAt,
					isOverdue,
					isEscalated:
						Boolean(assignment?.escalatedAt) ||
						(isOverdue &&
							(sourceType === MentorAttentionSourceType.PR_REVIEW ||
								sourceType === MentorAttentionSourceType.EXERCISE_REVIEW)),
					slaHours: Math.round(
						(dueAt.getTime() - slaStart.getTime()) / 3_600_000
					),
					assignedMentor: assignment?.assignedMentor ?? null,
					isAssignedToCurrentMentor:
						assignment?.assignedMentorId === ctx.session.userId,
					claimedAt: assignment?.claimedAt ?? null,
					firstResponseAt: assignment?.firstResponseAt ?? null,
					firstResponseMinutes: assignment?.firstResponseMinutes ?? null,
					completedAt: assignment?.completedAt ?? null,
					completionMinutes: assignment?.completionMinutes ?? null
				};
			});
			const consumedBySource = new Map<QueueSource, string>();
			for (const item of page) consumedBySource.set(item.source, item.id);

			const sourceRows = {
				prReview: prReviews,
				exerciseReview: exerciseReviews,
				blockedTask: blockedTasks,
				inactiveStudent: inactiveStudents,
				mentorshipSession: sessions
			};
			const hasMore = Object.entries(sourceRows).some(([source, rows]) => {
				if (!requestedSources.includes(source as QueueSource)) return false;
				return (
					rows.length > page.filter((item) => item.source === source).length
				);
			});
			const nextCursor = hasMore
				? encodeCursor({ ...cursor, ...Object.fromEntries(consumedBySource) })
				: undefined;

			return { items: page, nextCursor };
		}),

	getSummary: adminProcedure.query(async ({ ctx }) => {
		const [
			activeCount,
			firstResponseCount,
			completionCount,
			responseAverage,
			completionAverage
		] = await Promise.all([
			ctx.db.mentorAttentionAssignment.count({
				where: {
					assignedMentorId: ctx.session.userId,
					completedAt: null
				}
			}),
			ctx.db.mentorAttentionAssignment.count({
				where: { firstResponseAt: { not: null } }
			}),
			ctx.db.mentorAttentionAssignment.count({
				where: { completedAt: { not: null } }
			}),
			ctx.db.mentorAttentionAssignment.aggregate({
				where: { firstResponseMinutes: { not: null } },
				_avg: { firstResponseMinutes: true }
			}),
			ctx.db.mentorAttentionAssignment.aggregate({
				where: { completionMinutes: { not: null } },
				_avg: { completionMinutes: true }
			})
		]);

		return {
			capacity: {
				limit: MENTOR_ATTENTION_CAPACITY,
				active: activeCount,
				remaining: Math.max(0, MENTOR_ATTENTION_CAPACITY - activeCount)
			},
			metrics: {
				firstResponseCount,
				completionCount,
				averageFirstResponseMinutes:
					responseAverage._avg.firstResponseMinutes ?? null,
				averageCompletionMinutes:
					completionAverage._avg.completionMinutes ?? null
			}
		};
	}),

	claim: adminProcedure
		.input(
			z.object({
				sourceType: attentionSourceSchema,
				sourceId: z.string().min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const now = new Date();
			const source = await getActiveClaimSource(
				ctx.db,
				input.sourceType,
				input.sourceId,
				now
			);
			if (!source) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'This attention item is no longer available'
				});
			}

			try {
				return await ctx.db.$transaction(async (tx) => {
					const existing = await tx.mentorAttentionAssignment.findUnique({
						where: {
							sourceType_sourceId: {
								sourceType: input.sourceType,
								sourceId: input.sourceId
							}
						}
					});

					if (existing?.completedAt) {
						throw new TRPCError({
							code: 'CONFLICT',
							message: 'This attention item has already been completed'
						});
					}
					if (existing?.assignedMentorId) {
						if (existing.assignedMentorId === ctx.session.userId) {
							return { success: true, assignment: existing };
						}
						throw new TRPCError({
							code: 'CONFLICT',
							message:
								'This attention item is already assigned to another mentor'
						});
					}

					await tx.$queryRaw(
						Prisma.sql`SELECT "id" FROM "public"."User" WHERE "id" = ${ctx.session.userId} FOR UPDATE`
					);
					const activeCount = await tx.mentorAttentionAssignment.count({
						where: {
							assignedMentorId: ctx.session.userId,
							completedAt: null
						}
					});
					if (activeCount >= MENTOR_ATTENTION_CAPACITY) {
						throw new TRPCError({
							code: 'CONFLICT',
							message: `Mentor capacity reached (${MENTOR_ATTENTION_CAPACITY} active items)`
						});
					}

					const firstResponseAt = existing?.firstResponseAt ?? now;
					const data = {
						sourceType: input.sourceType,
						sourceId: input.sourceId,
						sourceCreatedAt: source.sourceCreatedAt,
						dueAt:
							existing?.dueAt ??
							dueAtFor(input.sourceType, source.sourceCreatedAt),
						assignedMentorId: ctx.session.userId,
						claimedAt: now,
						firstResponseAt,
						firstResponseMinutes:
							existing?.firstResponseMinutes ??
							minutesBetween(source.sourceCreatedAt, firstResponseAt)
					};

					const assignment = existing
						? await tx.mentorAttentionAssignment.update({
								where: { id: existing.id },
								data
							})
						: await tx.mentorAttentionAssignment.create({ data });

					return { success: true, assignment };
				});
			} catch (error) {
				if (isUniqueConstraintError(error)) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'This attention item was claimed by another mentor'
					});
				}
				throw error;
			}
		}),

	release: adminProcedure
		.input(
			z.object({
				sourceType: attentionSourceSchema,
				sourceId: z.string().min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db.mentorAttentionAssignment.updateMany({
				where: {
					sourceType: input.sourceType,
					sourceId: input.sourceId,
					assignedMentorId: ctx.session.userId,
					completedAt: null
				},
				data: { assignedMentorId: null, claimedAt: null }
			});
			if (result.count === 0) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This attention item is not assigned to you'
				});
			}
			return { success: true };
		})
});
