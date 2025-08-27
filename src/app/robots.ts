import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = 'https://app.codewise.online/';

	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/api/',
					'/admin/',
					'/workspace/',
					'/my-projects',
					'/sso-callback',
					'/success',
					'/canceled'
				]
			}
		],
		sitemap: `${baseUrl}/sitemap.xml`,
		host: baseUrl
	};
}
