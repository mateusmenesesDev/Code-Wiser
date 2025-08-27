import type { MetadataRoute } from 'next';
import { db } from '~/server/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://app.codewise.online/';

	// Get all approved projects
	const projects = await db.projectTemplate.findMany({
		where: { status: 'APPROVED' },
		select: { id: true, updatedAt: true }
	});

	// Static pages
	const staticPages = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily' as const,
			priority: 1
		},
		{
			url: `${baseUrl}/pricing`,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.8
		}
	];

	// Project pages
	const projectPages = projects.map((project) => ({
		url: `${baseUrl}/project/${project.id}`,
		lastModified: project.updatedAt,
		changeFrequency: 'weekly' as const,
		priority: 0.7
	}));

	return [...staticPages, ...projectPages];
}
