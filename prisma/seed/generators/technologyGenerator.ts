import type { PrismaClient } from '@prisma/client';
import { TECH_STACKS } from '../data/technologies';

export interface TechnologyRecord {
	id: string;
	name: string;
}

export async function createTechnologies(prisma: PrismaClient) {
	console.log('⚙️ Creating technologies...');
	const technologies = [];
	const allTechs = new Set();

	// Collect all unique technologies
	for (const techs of Object.values(TECH_STACKS)) {
		for (const tech of techs) {
			allTechs.add(tech);
		}
	}

	for (const techName of allTechs) {
		const technology = await prisma.technology.upsert({
			where: { name: techName as string },
			update: {},
			create: {
				name: techName as string,
				approved: true
			}
		});
		technologies.push(technology);
	}

	return technologies;
}
