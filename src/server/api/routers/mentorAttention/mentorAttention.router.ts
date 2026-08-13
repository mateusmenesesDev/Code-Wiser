import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '~/server/api/trpc';

const QUEUE_LIMIT = 20;
const INACTIVITY_DAYS = 14;
const UPCOMING_SESSION_DAYS = 14;
const HIGH_PRIORITY_SESSION_DAYS = 3;

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
								members: { select: { id: true, name: true, email: true } }
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
							{ projects: { some: { updatedAt: { gte: inactivityCutoff } } } },
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
									{ projects: { some: { canceledAt: null } } },
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
					learner: task.assignees[0] ?? task.project?.members[0] ?? null,
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

			const page = items.slice(0, input.limit);
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
		})
});
