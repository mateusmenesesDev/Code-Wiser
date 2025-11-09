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

	delete: adminProcedure.input(z.string()).mutation(async ({ input }) => {
		try {
			// Delete from Clerk first
			await clerkClient.users.deleteUser(input);
		} catch (error) {
			// If Clerk user doesn't exist or deletion fails, log but continue
			console.error(`Failed to delete Clerk user ${input}:`, error);
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to delete user'
			});
		}

		return await deleteUser(input);
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
				mentorshipType: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL']).optional(),
				mentorshipStartDate: z.coerce.date().nullable().optional(),
				mentorshipEndDate: z.coerce.date().nullable().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			return await updateUserAdmin(id, data);
		})
});
