import { NextResponse } from 'next/server';
import { env } from '~/env';
import { db } from '~/server/db';
import { processQueuedPRReviewAnalyses } from '~/server/services/prReviewAnalysis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	if (request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await processQueuedPRReviewAnalyses(db);
		return NextResponse.json({ success: result.failed === 0, ...result });
	} catch (error) {
		console.error('Error in pr-review-analysis cron:', error);
		return NextResponse.json(
			{ success: false, error: 'PR review analysis worker failed' },
			{ status: 500 }
		);
	}
}
