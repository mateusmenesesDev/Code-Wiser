import type { Prisma, Technology } from '@prisma/client';

export async function upsertTechnologies(
	prisma: Prisma.TransactionClient,
	techNames: string[]
): Promise<Technology[]> {
	return Promise.all(
		techNames.map((tech) =>
			prisma.technology.upsert({
				where: { name: tech },
				update: {},
				create: { name: tech }
			})
		)
	);
}
