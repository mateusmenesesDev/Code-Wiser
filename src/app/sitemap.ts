import type { MetadataRoute } from 'next';
import { db } from '~/server/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://app.codewise.online/';

	const [projects, portfolios] = await Promise.all([
		db.projectTemplate.findMany({
			where: { status: 'APPROVED' },
			select: { id: true, updatedAt: true }
		}),
		db.project.findMany({
			where: {
				canceledAt: null,
				portfolioPublishedAt: { not: null },
				publicCode: { not: null }
			},
			select: { publicCode: true, updatedAt: true }
		})
	]);

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

	const projectPages = projects.map((project) => ({
		url: `${baseUrl}/project/${project.id}`,
		lastModified: project.updatedAt,
		changeFrequency: 'weekly' as const,
		priority: 0.7
	}));
	const portfolioPages = portfolios.flatMap((portfolio) =>
		portfolio.publicCode
			? [
					{
						url: `${baseUrl}/portfolio/${portfolio.publicCode}`,
						lastModified: portfolio.updatedAt,
						changeFrequency: 'weekly' as const,
						priority: 0.6
					}
				]
			: []
	);

	return [...staticPages, ...projectPages, ...portfolioPages];
}
