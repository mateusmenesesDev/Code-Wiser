import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from '~/server/api/trpc';
import {
	createFeedbackInputSchema,
	feedbackStatusSchema,
	listFeedbackInputSchema
} from '~/features/feedback/feedback.schema';
import { sendFeedbackNotification } from './feedback.email';

const SUBMISSION_LIMIT = 3;
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

export const feedbackRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createFeedbackInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.userId;
			const since = new Date(Date.now() - SUBMISSION_WINDOW_MS);

			const recentSubmissionCount = await ctx.db.feedbackReport.count({
				where: {
					userId,
					createdAt: { gte: since }
				}
			});

			if (recentSubmissionCount >= SUBMISSION_LIMIT) {
				throw new TRPCError({
					code: 'TOO_MANY_REQUESTS',
					message: 'You can submit up to 3 reports every 10 minutes.'
				});
			}

			const dbUser = await ctx.db.user.findUnique({
				where: { id: userId },
				select: { email: true, name: true }
			});

			let reporterEmail = dbUser?.email ?? '';
			let reporterName = dbUser?.name ?? null;

			try {
				const clerkUser = await clerkClient.users.getUser(userId);
				reporterEmail =
					clerkUser.primaryEmailAddress?.emailAddress ?? reporterEmail;
				reporterName = clerkUser.fullName ?? reporterName;
			} catch (error) {
				console.warn(`Could not load Clerk user ${userId} for feedback`, error);
			}

			if (!reporterEmail) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Your account needs an email address to submit feedback.'
				});
			}

			const report = await ctx.db.feedbackReport.create({
				data: {
					type: input.type,
					title: input.title,
					description: input.description,
					url: input.url,
					userAgent: input.userAgent,
					browser: input.browser,
					viewportWidth: input.viewportWidth,
					viewportHeight: input.viewportHeight,
					screenshotUrl: input.screenshotUrl,
					screenshotKey: input.screenshotKey,
					reporterEmail,
					reporterName,
					userId
				}
			});

			try {
				await sendFeedbackNotification(report);
			} catch (error) {
				console.error(
					`Feedback notification failed for report ${report.id}`,
					error
				);
			}

			return { id: report.id };
		}),

	list: adminProcedure
		.input(listFeedbackInputSchema)
		.query(async ({ ctx, input }) => {
			const search = input.search?.trim();
			const where = {
				...(input.status ? { status: input.status } : {}),
				...(input.type ? { type: input.type } : {}),
				...(search
					? {
							OR: [
								{ title: { contains: search, mode: 'insensitive' as const } },
								{
									description: {
										contains: search,
										mode: 'insensitive' as const
									}
								},
								{
									reporterEmail: {
										contains: search,
										mode: 'insensitive' as const
									}
								},
								{
									reporterName: {
										contains: search,
										mode: 'insensitive' as const
									}
								}
							]
						}
					: {})
			};

			const [reports, total] = await Promise.all([
				ctx.db.feedbackReport.findMany({
					where,
					orderBy: { createdAt: 'desc' },
					skip: input.skip,
					take: input.take,
					select: {
						id: true,
						createdAt: true,
						type: true,
						status: true,
						title: true,
						reporterEmail: true,
						reporterName: true,
						url: true
					}
				}),
				ctx.db.feedbackReport.count({ where })
			]);

			return { reports, total };
		}),

	getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const report = await ctx.db.feedbackReport.findUnique({
			where: { id: input }
		});

		if (!report) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
		}

		return report;
	}),

	updateStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: feedbackStatusSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.feedbackReport.update({
				where: { id: input.id },
				data: { status: input.status }
			});
		})
});
