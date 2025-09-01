import { db } from '~/server/db';

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
