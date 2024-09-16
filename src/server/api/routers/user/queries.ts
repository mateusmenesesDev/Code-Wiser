import { db } from "~/server/db";

export async function createUser(email: string, id: string) {
  return await db.user.create({
    data: {
      id,
      email,
    }
  });
}

export async function updateUser(id: string, data: Partial<{ email: string; name: string }>) {
  return await db.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  return await db.user.delete({
    where: { id },
  });
}
