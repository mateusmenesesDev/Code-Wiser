import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPortfolioPage from '~/features/portfolio/components/PublicPortfolioPage';
import { getPublicPortfolioByCode } from '~/server/services/portfolio';
import { db } from '~/server/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
	params
}: {
	params: { publicCode: string };
}): Promise<Metadata> {
	const portfolio = await getPublicPortfolioByCode(db, params.publicCode);
	if (!portfolio) {
		return { title: 'Portfolio not found' };
	}

	return {
		title: `${portfolio.title} | CodeWise Portfolio`,
		description: portfolio.summary,
		openGraph: {
			title: portfolio.title,
			description: portfolio.summary,
			type: 'website'
		},
		robots: { index: true, follow: true }
	};
}

export default async function PortfolioRoute({
	params
}: {
	params: { publicCode: string };
}) {
	const portfolio = await getPublicPortfolioByCode(db, params.publicCode);
	if (!portfolio) notFound();

	return <PublicPortfolioPage portfolio={portfolio} />;
}
