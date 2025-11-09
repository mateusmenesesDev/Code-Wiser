import { db } from '~/server/db';
import type { MentorshipStatus, MentorshipType } from '@prisma/client';

type UserData = {
	email: string;
	name: string;
	id: string;
};

export async function createUser(data: UserData) {
	return await db.user.create({
		data
	});
}

export async function updateUser(
	id: string,
	data: Partial<{ email: string; name: string }>
) {
	return await db.user.update({
		where: { id },
		data
	});
}

export async function deleteUser(id: string) {
	return await db.user.delete({
		where: { id }
	});
}

export async function getAllUsers(options?: {
	search?: string;
	mentorshipStatus?: MentorshipStatus;
	skip?: number;
	take?: number;
}) {
	const where = {
		...(options?.search && {
			OR: [
				{ email: { contains: options.search, mode: 'insensitive' as const } },
				{ name: { contains: options.search, mode: 'insensitive' as const } }
			]
		}),
		...(options?.mentorshipStatus && {
			mentorshipStatus: options.mentorshipStatus
		})
	};

	const [users, total] = await Promise.all([
		db.user.findMany({
			where,
			skip: options?.skip,
			take: options?.take,
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				email: true,
				name: true,
				credits: true,
				mentorshipStatus: true,
				mentorshipType: true,
				mentorshipStartDate: true,
				mentorshipEndDate: true,
				createdAt: true,
				updatedAt: true,
				stripeCustomerId: true,
				stripeSubscriptionId: true
			}
		}),
		db.user.count({ where })
	]);

	return { users, total };
}

export async function updateUserAdmin(
	id: string,
	data: Partial<{
		credits: number;
		mentorshipStatus: MentorshipStatus;
		mentorshipType: MentorshipType;
		mentorshipStartDate: Date | null;
		mentorshipEndDate: Date | null;
	}>
) {
	return await db.user.update({
		where: { id },
		data
	});
}
