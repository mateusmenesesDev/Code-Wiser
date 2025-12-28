import { NextResponse } from 'next/server';
import { env } from '~/env';
import { resetAllWeeklySessions } from '~/server/services/mentorship/mentorshipService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	try {
		// Verify the cron secret
		const authHeader = request.headers.get('authorization');
		if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Reset all weekly sessions
		const result = await resetAllWeeklySessions();

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: `Successfully reset weekly sessions for ${result.count} users`,
				count: result.count
			});
		}

		return NextResponse.json(
			{
				success: false,
				message: 'Failed to reset weekly sessions'
			},
			{ status: 500 }
		);
	} catch (error) {
		console.error('Error in reset-weekly-sessions cron:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
