import type { Category, Prisma } from '@prisma/client';

export async function upsertCategory(
	prisma: Prisma.TransactionClient,
	categoryName: string
): Promise<Category> {
	return prisma.category.upsert({
		where: { name: categoryName },
		update: {},
		create: { name: categoryName }
	});
}
