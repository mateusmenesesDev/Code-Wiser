import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { userDbSchema } from '~/features/schemas/auth.schema';
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from '../../trpc';
import {
	createUser,
	deleteUser,
	getAllUsers,
	updateUserAdmin
} from './queries';

export const userRouter = createTRPCRouter({
	create: publicProcedure.input(userDbSchema).mutation(async ({ input }) => {
		return await createUser({
			email: input.email,
			id: input.id,
			name: input.name
		});
	}),

	getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
		const clerkUser = await clerkClient.users.getUser(input);
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

		if (!clerkUser) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Clerk user not found'
			});
		}

		const userWithImageUrl = {
			...user,
			imageUrl: clerkUser.imageUrl
		};

		return userWithImageUrl;
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

	getMentorship: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findUnique({
			where: { id: ctx.session.userId },
			select: { mentorshipStatus: true }
		});
	}),

	getAvatar: protectedProcedure
		.input(
			z.object({
				userId: z.string()
			})
		)
		.query(async ({ input }) => {
			const clerkUser = await clerkClient.users.getUser(input.userId);
			return clerkUser.imageUrl;
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
			const result = await getAllUsers({
				search: input?.search,
				mentorshipStatus: input?.mentorshipStatus,
				skip: input?.skip,
				take: input?.take
			});

			// Fetch Clerk user data for avatars
			const usersWithAvatars = await Promise.all(
				result.users.map(async (user) => {
					try {
						const clerkUser = await clerkClient.users.getUser(user.id);
						return {
							...user,
							imageUrl: clerkUser.imageUrl
						};
					} catch {
						return {
							...user,
							imageUrl: null
						};
					}
				})
			);

			return {
				users: usersWithAvatars,
				total: result.total
			};
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				credits: z.number().int().optional(),
				mentorshipStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
				mentorshipType: z
					.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL'])
					.optional(),
				mentorshipStartDate: z.coerce.date().nullable().optional(),
				mentorshipEndDate: z.coerce.date().nullable().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			return await updateUserAdmin(id, data);
		})
});
