import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { userDbSchema } from '~/features/schemas/auth.schema';
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from '../../trpc';
import { createUser, deleteUser } from './queries';

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

	delete: publicProcedure.input(z.string()).mutation(async ({ input }) => {
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
		})
});
