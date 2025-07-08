import type { PrismaClient } from '@prisma/client';
import { CATEGORIES } from '../data/categories';

export interface Category {
	id: string;
	name: string;
}

export async function createCategories(prisma: PrismaClient) {
	console.log('📂 Creating categories...');
	const categories = [];

	for (const categoryName of CATEGORIES) {
		const category = await prisma.category.upsert({
			where: { name: categoryName },
			update: {},
			create: {
				name: categoryName,
				approved: true
			}
		});
		categories.push(category);
	}

	return categories;
}
