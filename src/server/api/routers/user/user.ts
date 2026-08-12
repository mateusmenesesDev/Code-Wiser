import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { applyCreditTransaction } from '~/server/services/creditLedger';
import { adminResetUserSessions } from '~/server/services/mentorship/mentorshipService';
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from '../../trpc';
import { deleteUser, getAllUsers, updateUserAdmin } from './queries';

export const userRouter = createTRPCRouter({
	getById: adminProcedure.input(z.string()).query(async ({ input, ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: {
				id: input
			}
		});

		if (!user) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'User not found'
			});
		}

		if (user.imageUrl) {
			return user;
		}

		try {
			const clerkUser = await clerkClient.users.getUser(input);
			if (clerkUser.imageUrl) {
				await ctx.db.user.update({
					where: { id: input },
					data: { imageUrl: clerkUser.imageUrl }
				});
				return { ...user, imageUrl: clerkUser.imageUrl };
			}
		} catch {
			// Fall through with null image when Clerk is unavailable.
		}

		return user;
	}),

	delete: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
		// Check if user exists in database first
		const dbUser = await ctx.db.user.findUnique({
			where: { id: input }
		});

		if (!dbUser) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'User not found in database'
			});
		}

		// Try to delete from Clerk, but don't fail if user doesn't exist there
		try {
			await clerkClient.users.deleteUser(input);
		} catch (error: unknown) {
			// If Clerk user doesn't exist or deletion fails, log but continue with DB deletion
			// This handles cases where:
			// - User was already deleted from Clerk
			// - User doesn't exist in Clerk (orphaned DB record)
			// - Other Clerk API errors
			const clerkError = error as { status?: number; message?: string };
			if (clerkError.status === 404) {
				console.log(
					`Clerk user ${input} not found (status 404), proceeding with database deletion`
				);
			} else {
				console.error(
					`Failed to delete Clerk user ${input}:`,
					clerkError.message || error
				);
				// Continue with database deletion even if Clerk deletion fails
			}
		}

		// Delete from database
		try {
			return await deleteUser(input);
		} catch (error) {
			console.error(`Failed to delete user from database ${input}:`, error);
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown database error';

			// Check if it's a foreign key constraint error
			if (
				errorMessage.includes('Foreign key constraint') ||
				errorMessage.includes('violates foreign key constraint')
			) {
				throw new TRPCError({
					code: 'CONFLICT',
					message:
						'Cannot delete user: user has associated records that must be removed first'
				});
			}

			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: `Failed to delete user from database: ${errorMessage}`
			});
		}
	}),

	getCredits: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findUnique({
			where: { id: ctx.session.userId },
			select: { credits: true }
		});
	}),

	getCreditTransactions: protectedProcedure
		.input(
			z.object({
				skip: z.number().int().min(0).default(0),
				take: z.number().int().min(1).max(100).default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const [transactions, total, balance, ledger] = await Promise.all([
				ctx.db.creditTransaction.findMany({
					where: { userId: ctx.session.userId },
					skip: input.skip,
					take: input.take,
					orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
				}),
				ctx.db.creditTransaction.count({
					where: { userId: ctx.session.userId }
				}),
				ctx.db.user.findUnique({
					where: { id: ctx.session.userId },
					select: { credits: true }
				}),
				ctx.db.creditTransaction.aggregate({
					where: { userId: ctx.session.userId },
					_sum: { value: true }
				})
			]);

			return {
				transactions,
				total,
				storedBalance: balance?.credits ?? 0,
				ledgerBalance: ledger._sum.value ?? 0,
				difference: (balance?.credits ?? 0) - (ledger._sum.value ?? 0)
			};
		}),

	getCreditTransactionsForUser: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				skip: z.number().int().min(0).default(0),
				take: z.number().int().min(1).max(100).default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const [transactions, total, balance, ledger] = await Promise.all([
				ctx.db.creditTransaction.findMany({
					where: { userId: input.userId },
					skip: input.skip,
					take: input.take,
					orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
				}),
				ctx.db.creditTransaction.count({
					where: { userId: input.userId }
				}),
				ctx.db.user.findUnique({
					where: { id: input.userId },
					select: { credits: true }
				}),
				ctx.db.creditTransaction.aggregate({
					where: { userId: input.userId },
					_sum: { value: true }
				})
			]);

			if (!balance) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
			}

			return {
				transactions,
				total,
				storedBalance: balance.credits,
				ledgerBalance: ledger._sum.value ?? 0,
				difference: balance.credits - (ledger._sum.value ?? 0)
			};
		}),

	getMentorshipStatus: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findUnique({
			where: { id: ctx.session.userId },
			select: { mentorshipStatus: true }
		});
	}),

	getAvatar: adminProcedure
		.input(
			z.object({
				userId: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: { id: input.userId },
				select: { imageUrl: true }
			});

			if (user?.imageUrl) {
				return user.imageUrl;
			}

			try {
				const clerkUser = await clerkClient.users.getUser(input.userId);
				if (clerkUser.imageUrl) {
					await ctx.db.user.update({
						where: { id: input.userId },
						data: { imageUrl: clerkUser.imageUrl }
					});
				}
				return clerkUser.imageUrl;
			} catch {
				return null;
			}
		}),

	listAll: adminProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					mentorshipStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
					skip: z.number().int().min(0).default(0),
					take: z.number().int().min(1).max(100).default(50)
				})
				.optional()
		)
		.query(async ({ input }) => {
			// Avatars come from User.imageUrl (Clerk webhook projection) — no per-row Clerk fan-out.
			return getAllUsers({
				search: input?.search,
				mentorshipStatus: input?.mentorshipStatus,
				skip: input?.skip,
				take: input?.take
			});
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				mentorshipStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
				mentorshipType: z
					.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL'])
					.optional(),
				mentorshipStartDate: z.coerce.date().nullable().optional(),
				mentorshipEndDate: z.coerce.date().nullable().optional(),
				weeklyMentorshipSessions: z.number().int().min(1).max(3).optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			return await updateUserAdmin(id, data);
		}),

	adjustCredits: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				delta: z
					.number()
					.int()
					.refine((value) => value !== 0),
				reason: z.string().trim().min(1).max(500),
				idempotencyKey: z.string().uuid()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const transaction = await ctx.db.$transaction((tx) =>
				applyCreditTransaction(tx, {
					userId: input.userId,
					type: 'ADJUSTMENT',
					value: input.delta,
					source: 'ADMIN',
					externalReference: input.userId,
					idempotencyKey: `admin-adjustment:${input.idempotencyKey}`,
					actorUserId: ctx.session.userId,
					note: input.reason
				})
			);

			return transaction;
		}),

	resetUserWeeklySessions: adminProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input }) => {
			try {
				await adminResetUserSessions(input.userId);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						error instanceof Error
							? error.message
							: 'Failed to reset weekly sessions'
				});
			}
		})
});
